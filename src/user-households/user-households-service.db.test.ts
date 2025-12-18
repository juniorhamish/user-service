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
  it('should return an empty list if the user has not created any households', async () => {
    const result = await serviceA.getUserHouseholds();
    expect(result).toEqual([]);
  });
  it('should return the created household', async () => {
    const result = await serviceA.createHousehold({ name: 'Test Household' });
    expect(result).toEqual(expect.objectContaining({ name: 'Test Household', pending_invites: [] }));
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
    await expect((async () => await serviceB.updateHousehold(household.id, { name: 'B' }))()).rejects.toThrowError(
      `Household with id ${household.id} not found`,
    );
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
  it('should throw a not found error if the requested household does not exist', async () => {
    await expect((async () => await serviceA.updateHousehold(1234, { name: 'A' }))()).rejects.toThrowError(
      'Household with id 1234 not found',
    );
  });
  it('should return an invitation for each invited user', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    const result = await serviceA.inviteUsers(id, ['test@foo.com', 'test@bar.com']);
    expect(result).toEqual([
      expect.objectContaining({ invited_user: 'test@foo.com', household_id: id, invited_by_user_id: 'A' }),
      expect.objectContaining({ invited_user: 'test@bar.com', household_id: id, invited_by_user_id: 'A' }),
    ]);
  });
  it('should not be possible to invite a user to a household you are not the owner of', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await expect((async () => await serviceB.inviteUsers(id, ['test@foo.com']))()).rejects.toThrowError(
      `Household with id ${id} not found`,
    );
  });
  it('should throw an error if the household ID does not exist', async () => {
    await expect((async () => await serviceB.inviteUsers(1, ['test@foo.com']))()).rejects.toThrowError(
      'Household with id 1 not found',
    );
  });
  it('should throw an error if an invitee is already the owner of the household', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await expect((async () => await serviceA.inviteUsers(id, ['A']))()).rejects.toThrowError(
      'The invited user is already the owner of the household',
    );
  });
  it('should throw an error if an invitee is already invited to the household', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceA.inviteUsers(id, ['B']);
    await expect((async () => await serviceA.inviteUsers(id, ['B']))()).rejects.toThrowError('User already invited');
  });
  it('should include pending invites in the list of households response', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceA.inviteUsers(id, ['B']);
    const households = await serviceA.getUserHouseholds();
    expect(households).toEqual([
      expect.objectContaining({
        name: 'A',
        pending_invites: [expect.objectContaining({ invited_user: 'B', household_id: id, invited_by_user_id: 'A' })],
      }),
    ]);
  });
  it('should include pending invites in the update household response', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceA.inviteUsers(id, ['B']);
    const updatedHousehold = await serviceA.updateHousehold(id, { name: 'C' });
    expect(updatedHousehold).toEqual(
      expect.objectContaining({
        name: 'C',
        pending_invites: [expect.objectContaining({ invited_user: 'B', household_id: id, invited_by_user_id: 'A' })],
      }),
    );
  });
});
