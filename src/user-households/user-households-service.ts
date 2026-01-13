import type { PostgrestError } from '@supabase/supabase-js';
import {
  DATABASE_ERROR_CODES,
  DuplicateEntityError,
  ForbiddenError,
  InvitedUserIsOwnerError,
  NotFoundError,
} from '../db-error-handling/supabase-errors.js';
import { getSupabaseClient } from '../lib/supabase.js';

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
  private readonly supabase;
  private readonly user: string;

  constructor(user: string) {
    this.user = user;
    this.supabase = getSupabaseClient(user);
  }

  async createHousehold(household: WritableHousehold) {
    const { data, error } = await this.supabase.from('households').insert(household).select();
    if (error) {
      throw this.handleSupabaseError(error, household);
    }
    return await this.enrichHousehold(data[0]);
  }

  async deleteHousehold(id: number) {
    await this.supabase.from('households').delete().eq('id', id);
  }

  async getHousehold(id: number) {
    const { data } = await this.supabase.from('households').select().eq('id', id);
    if (!data || data.length === 0) throw new NotFoundError(`Household with id ${id} not found`);
    return await this.enrichHousehold(data[0]);
  }

  async updateHousehold(id: number, household: WritableHousehold) {
    await this.getHousehold(id);
    const { data, error } = await this.supabase.from('households').update(household).eq('id', id).select();
    if (error) {
      throw this.handleSupabaseError(error, household);
    }
    return await this.enrichHousehold(data[0]);
  }

  handleSupabaseError(error: PostgrestError, household: WritableHousehold) {
    if (error.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      return new DuplicateEntityError(`Household with name ${household.name} already exists`);
    }
    return error;
  }

  async getUserHouseholds() {
    const { data, error } = await this.supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false });

    /* v8 ignore if -- @preserve */
    if (error) {
      throw error;
    }
    return Promise.all(data.map(async (household) => await this.enrichHousehold(household)));
  }

  async enrichHousehold(household: Household) {
    const [{ data: pending_invites }, { data: members }] = await Promise.all([
      this.supabase.from('household_invitations').select('*').eq('household_id', household.id),
      this.supabase.from('household_members').select('*').eq('household_id', household.id),
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
    const { data, error } = await this.supabase
      .from('household_invitations')
      .insert(emails.map((email) => ({ invited_user: email, household_id: householdId })))
      .select();
    if (error) {
      throw new DuplicateEntityError('User already invited');
    }
    return data;
  }

  async deleteInvitation(invitationId: number) {
    await this.supabase.from('household_invitations').delete().eq('id', invitationId);
  }

  async acceptInvitation(invitationId: number) {
    const { data: invitation, error: fetchError } = await this.supabase
      .from('household_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) {
      throw new NotFoundError(`Invitation with id ${invitationId} not found`);
    }
    if (invitation.invited_user !== this.user) {
      throw new ForbiddenError('This invitation is not for you');
    }

    await this.supabase.from('household_members').insert({
      household_id: invitation.household_id,
      user_id: this.user,
    });
    await this.supabase.from('household_invitations').delete().eq('id', invitationId);
  }
}
