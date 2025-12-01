import { getSupabaseClient } from '../lib/supabase.js';

export class UserHouseholdsService {
  private readonly supabase;

  constructor(user: string) {
    this.supabase = getSupabaseClient(user);
  }

  async createHousehold(household: { name: string }) {
    const { data, error } = await this.supabase.from('households').insert(household).select();
    if (error) throw error;
    return data[0];
  }

  async deleteHousehold(id: number) {
    await this.supabase.from('households').delete().eq('id', id);
  }

  async getUserHouseholds() {
    const { data } = await this.supabase.from('households').select('*').order('created_at', { ascending: false });
    return data;

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
}
