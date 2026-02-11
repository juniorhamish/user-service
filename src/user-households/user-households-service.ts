import { DatabaseError } from '@neondatabase/serverless';
import {
  DATABASE_ERROR_CODES,
  DuplicateEntityError,
  ForbiddenError,
  InvitedUserIsOwnerError,
  NotFoundError,
} from '../db-error-handling/db-errors.js';
import { query } from '../lib/db.js';

export type HouseholdMember = {
  id: number;
  user_id: string;
  joined_at: string;
};

export type Household = {
  id: number;
  name: string;
  updated_at: string | null;
  created_at: string | null;
  created_by: string;
  members?: HouseholdMember[];
  pending_invites?: HouseholdInvitation[];
};
export type WritableHousehold = { name: string };
export type HouseholdInvitation = {
  id: number;
  household_id: number;
  invited_user: string;
  invited_by_user_id: string;
  invited_at: string | null;
};

export class UserHouseholdsService {
  private readonly user: string;

  constructor(user: string) {
    this.user = user;
  }

  async createHousehold(household: WritableHousehold) {
    try {
      const { rows } = await query(
        'INSERT INTO user_service.households (name, created_by) VALUES ($1, $2) RETURNING *',
        [household.name, this.user],
      );
      const createdHousehold = rows[0];
      await query('INSERT INTO user_service.household_members (household_id, user_id) VALUES ($1, $2)', [
        createdHousehold.id,
        this.user,
      ]);
      return await this.enrichHousehold(createdHousehold);
    } catch (error) {
      throw this.handleDatabaseError(error, household);
    }
  }

  async deleteHousehold(id: number) {
    await query('DELETE FROM user_service.households WHERE id = $1 AND created_by = $2', [id, this.user]);
  }

  async getHousehold(id: number) {
    const { rows } = await query(
      `SELECT * FROM user_service.households 
       WHERE id = $1 AND (created_by = $2 OR id IN (SELECT household_id FROM user_service.household_members WHERE user_id = $2))`,
      [id, this.user],
    );
    if (rows.length === 0) throw new NotFoundError(`Household with id ${id} not found`);
    return await this.enrichHousehold(rows[0]);
  }

  async updateHousehold(id: number, household: WritableHousehold) {
    await this.getHousehold(id);
    const { rows } = await query(
      'UPDATE user_service.households SET name = $1, updated_at = NOW() WHERE id = $2 AND created_by = $3 RETURNING *',
      [household.name, id, this.user],
    ).catch((error) => {
      throw this.handleDatabaseError(error, household);
    });

    if (rows.length === 0) throw new NotFoundError(`Household with id ${id} not found`);
    return await this.enrichHousehold(rows[0]);
  }

  handleDatabaseError(error: unknown, household: WritableHousehold) {
    if (error instanceof DatabaseError && error.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      return new DuplicateEntityError(`Household with name ${household.name} already exists`);
    }
    return error;
  }

  async getUserHouseholds() {
    const { rows } = await query(
      `SELECT * FROM user_service.households 
       WHERE created_by = $1 OR id IN (SELECT household_id FROM user_service.household_members WHERE user_id = $1)
       ORDER BY created_at DESC`,
      [this.user],
    );
    return Promise.all(rows.map(async (household) => await this.enrichHousehold(household)));
  }

  async enrichHousehold(household: Household) {
    const [{ rows: pending_invites }, { rows: members }] = await Promise.all([
      query('SELECT * FROM user_service.household_invitations WHERE household_id = $1', [household.id]),
      query('SELECT * FROM user_service.household_members WHERE household_id = $1', [household.id]),
    ]);

    return {
      ...household,
      pending_invites,
      members,
    };
  }

  async inviteUsers(householdId: number, emails: string[]) {
    const household = await this.getHousehold(householdId);
    if (emails.includes(household.created_by)) throw new InvitedUserIsOwnerError();

    return await Promise.all(
      emails.map(async (email) => {
        const { rows } = await query(
          'INSERT INTO user_service.household_invitations (invited_user, household_id, invited_by_user_id) VALUES ($1, $2, $3) RETURNING *',
          [email, householdId, this.user],
        ).catch((error) => {
          if (error instanceof DatabaseError && error.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
            throw new DuplicateEntityError('User already invited');
          }
          throw error;
        });
        return rows[0];
      }),
    );
  }

  async deleteInvitation(invitationId: number) {
    // Check if user is owner of the household or the invited user
    const { rows } = await query(
      `SELECT i.* FROM user_service.household_invitations i
       JOIN user_service.households h ON i.household_id = h.id
       WHERE i.id = $1 AND (h.created_by = $2 OR i.invited_user = $2)`,
      [invitationId, this.user],
    );

    if (rows.length > 0) {
      await query('DELETE FROM user_service.household_invitations WHERE id = $1', [invitationId]);
    }
  }

  async acceptInvitation(invitationId: number) {
    const { rows } = await query(
      `SELECT i.* FROM user_service.household_invitations i
       JOIN user_service.households h ON i.household_id = h.id
       WHERE i.id = $1 AND (i.invited_user = $2 OR h.created_by = $2)`,
      [invitationId, this.user],
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Invitation with id ${invitationId} not found`);
    }
    const invitation = rows[0];

    if (invitation.invited_user !== this.user) {
      throw new ForbiddenError('This invitation is not for you');
    }

    await query('INSERT INTO user_service.household_members (household_id, user_id) VALUES ($1, $2)', [
      invitation.household_id,
      this.user,
    ]);
    await query('DELETE FROM user_service.household_invitations WHERE id = $1', [invitationId]);
  }

  async removeMember(householdId: number, memberId: number) {
    const household = await this.getHousehold(householdId);
    const member = household.members?.find((m) => m.id === memberId);

    if (!member) {
      throw new NotFoundError(`Member with id ${memberId} not found in household ${householdId}`);
    }

    if (member.user_id === household.created_by) {
      throw new ForbiddenError('Cannot remove the creator of the household');
    }

    const isCreator = household.created_by === this.user;
    const isSelf = member.user_id === this.user;

    if (!isCreator && !isSelf) {
      throw new ForbiddenError('Only the household creator or the member themselves can remove a member');
    }

    await query('DELETE FROM user_service.household_members WHERE id = $1', [memberId]);
  }
}
