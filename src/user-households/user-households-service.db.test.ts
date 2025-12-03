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
    await expect((async () => await serviceA.createHousehold({ name: 'A' }))()).rejects.toThrowError(
      'Household with name A already exists',
    );
  });
  it('should throw an error when creating a household with invalid data', async () => {
    // @ts-expect-error
    await expect((async () => await serviceA.createHousehold({ foo: 'A' }))()).rejects.toThrowError(
      "Could not find the 'foo' column of 'households' in the schema cache",
    );
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
  it('should be possible to update an existing household created by the user making the request', async () => {
    const household = await serviceA.createHousehold({ name: 'A' });
    const updatedHousehold = await serviceA.updateHousehold(household.id, { name: 'B' });
    expect(updatedHousehold).toEqual({ ...household, name: 'B' });
    expect(await serviceA.getUserHouseholds()).toEqual([expect.objectContaining({ name: 'B' })]);
  });
  it('should not be possible to update a household created by another user', async () => {
    const household = await serviceA.createHousehold({ name: 'A' });
    await serviceB.updateHousehold(household.id, { name: 'B' });
    expect(await serviceA.getUserHouseholds()).toEqual([expect.objectContaining({ name: 'A' })]);
  });
  it('should not be possible to update a household to have the same name as an existing household', async () => {
    await serviceA.createHousehold({ name: 'A' });
    const household = await serviceA.createHousehold({ name: 'B' });
    await expect((async () => await serviceA.updateHousehold(household.id, { name: 'A' }))()).rejects.toThrowError(
      'Household with name A already exists',
    );
    expect(await serviceA.getUserHouseholds()).toEqual([
      expect.objectContaining({ name: 'B' }),
      expect.objectContaining({ name: 'A' }),
    ]);
  });
});
