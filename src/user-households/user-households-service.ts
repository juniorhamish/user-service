import type { PostgrestError } from '@supabase/supabase-js';
import {
  DATABASE_ERROR_CODES,
  DuplicateEntityError,
  InvitedUserIsOwnerError,
  NotFoundError,
} from '../db-error-handling/supabase-errors.js';
import { getSupabaseClient } from '../lib/supabase.js';

export type Household = {
  id: number;
  name: string;
  updated_at: string | null;
  created_at: string | null;
  created_by: string;
};
export type WritableHousehold = { name: string };
export type HouseholdInvitation = {
  invited_user: string;
};

export class UserHouseholdsService {
  private readonly supabase;

  constructor(user: string) {
    this.supabase = getSupabaseClient(user);
  }

  async createHousehold(household: WritableHousehold) {
    const { data, error } = await this.supabase.from('households').insert(household).select();
    if (error) {
      throw this.handleSupabaseError(error, household);
    }
    return { ...data[0], pending_invites: [] };
  }

  async deleteHousehold(id: number) {
    await this.supabase.from('households').delete().eq('id', id);
  }

  async getHousehold(id: number) {
    const { data } = await this.supabase.from('households').select().eq('id', id);
    if (!data || data.length === 0) throw new NotFoundError(`Household with id ${id} not found`);
    return data[0];
  }

  async updateHousehold(id: number, household: WritableHousehold) {
    await this.getHousehold(id);
    const { data, error } = await this.supabase.from('households').update(household).eq('id', id).select();
    if (error) {
      throw this.handleSupabaseError(error, household);
    }
    return await this.addPendingInvitations(data[0]);
  }

  handleSupabaseError(error: PostgrestError, household: WritableHousehold) {
    if (error.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      return new DuplicateEntityError(`Household with name ${household.name} already exists`);
    }
    return error;
  }

  async getUserHouseholds() {
    const { data } = await this.supabase.from('households').select('*').order('created_at', { ascending: false });
    return data && Promise.all(data.map(async (household) => await this.addPendingInvitations(household)));

    // Get members for each household
    // return await Promise.all(
    //   households.map(async (household) => {
    //     const { data: members, error: membersError } = await this.supabase
    //       .from('household_members')
    //       .select('*')
    //       .eq('household_id', household.id);
    //
    //     if (membersError) throw membersError;
    //
    //     const { firstName, lastName } = await getUserInfo(household.created_by);
    //
    //     return {
    //       ...household,
    //       created_by: `${firstName} ${lastName}`,
    //       members: members.map((m) => ({
    //         id: m.id,
    //         user_id: m.user_id,
    //         role: m.role,
    //         joined_at: m.joined_at,
    //       })),
    //     };
    //   }),
    // );
  }

  async addPendingInvitations(household: Household) {
    const { data: pending_invites } = await this.supabase
      .from('household_invitations')
      .select('*')
      .eq('household_id', household.id);

    return {
      ...household,
      pending_invites,
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
}
