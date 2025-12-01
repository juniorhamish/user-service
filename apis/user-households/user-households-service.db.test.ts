import { getSupabaseClient } from '../lib/supabase.js';
import { UserHouseholdsService } from './user-households-service.js';

describe('user households service', () => {
  let serviceA: UserHouseholdsService;
  let serviceB: UserHouseholdsService;
  async function cleanDB() {
    await getSupabaseClient('A').from('households').delete().eq('created_by', 'A');
    await getSupabaseClient('B').from('households').delete().eq('created_by', 'B');
  }
  beforeEach(async () => {
    serviceA = new UserHouseholdsService('A');
    serviceB = new UserHouseholdsService('B');
    await cleanDB();
  });
  afterEach(async () => {
    await cleanDB();
  });
  it('should return an empty list if the user has not created any ', async () => {
    const result = await serviceA.getUserHouseholds();
    expect(result).toEqual([]);
  });
  it('should return the created household', async () => {
    const result = await serviceA.createHousehold({ name: 'Test Household' });
    expect(result).toEqual(expect.objectContaining({ name: 'Test Household' }));
  });
  it('should return only the households created by themself', async () => {
    await serviceA.createHousehold({ name: 'A' });
    await serviceB.createHousehold({ name: 'B' });
    const result = await serviceB.getUserHouseholds();
    expect(result).toEqual([expect.objectContaining({ name: 'B' })]);
  });
  it('should return households ordered by most recently created', async () => {
    await serviceA.createHousehold({ name: 'A' });
    await serviceA.createHousehold({ name: 'B' });
    const result = await serviceA.getUserHouseholds();
    expect(result).toEqual([expect.objectContaining({ name: 'B' }), expect.objectContaining({ name: 'A' })]);
  });
  it('should throw an error when creating a household with an existing name', async () => {
    await serviceA.createHousehold({ name: 'A' });
    await expect((async () => await serviceA.createHousehold({ name: 'A' }))()).rejects.toThrowError();
  });
  it('should be possible to create a household with the same name as another user', async () => {
    await serviceA.createHousehold({ name: 'A' });
    await serviceB.createHousehold({ name: 'A' });
    const result = await serviceA.getUserHouseholds();
    expect(result).toEqual([expect.objectContaining({ name: 'A' })]);
  });
  it('should not delete a household from another user', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceB.deleteHousehold(id);
    expect(await serviceA.getUserHouseholds()).toEqual([expect.objectContaining({ name: 'A' })]);
  });
  it('should delete a household if user created it', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceA.deleteHousehold(id);
    expect(await serviceA.getUserHouseholds()).toEqual([]);
  });
});
