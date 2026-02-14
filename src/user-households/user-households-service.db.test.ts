import { query } from '../lib/db.js';
import { UserHouseholdsService } from './user-households-service.js';

describe('user households service', () => {
  let serviceA: UserHouseholdsService;
  let serviceB: UserHouseholdsService;
  let serviceC: UserHouseholdsService;
  async function cleanDB() {
    await query("DELETE FROM user_service.households WHERE created_by IN ('A', 'B', 'C')");
  }
  beforeEach(async () => {
    serviceA = new UserHouseholdsService('A');
    serviceB = new UserHouseholdsService('B');
    serviceC = new UserHouseholdsService('C');
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
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Test Household',
        pending_invites: [],
        members: [expect.objectContaining({ user_id: 'A' })],
      }),
    );
  });
  it('should invite users when creating a household', async () => {
    const result = await serviceA.createHousehold({
      name: 'Test Household',
      invitations: ['B', 'C'],
    });
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Test Household',
        pending_invites: [
          expect.objectContaining({ invited_user: 'B', invited_by_user_id: 'A' }),
          expect.objectContaining({ invited_user: 'C', invited_by_user_id: 'A' }),
        ],
        members: [expect.objectContaining({ user_id: 'A' })],
      }),
    );
  });
  it('should not create the household if it fails to invite the user too', async () => {
    await expect(
      (async () => await serviceA.createHousehold({ name: 'A', invitations: ['A'] }))(),
    ).rejects.toThrowError('The invited user is already the owner of the household');
    const households = await serviceA.getUserHouseholds();
    expect(households).toEqual([]);
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
    await expect((async () => await serviceA.createHousehold({ foo: 'A' }))()).rejects.toThrow();
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
    expect(updatedHousehold).toEqual({ ...household, updated_at: updatedHousehold.updated_at, name: 'B' });
    expect(await serviceA.getUserHouseholds()).toEqual([expect.objectContaining({ name: 'B' })]);
  });
  it('should not be possible to update a household created by another user', async () => {
    const household = await serviceA.createHousehold({ name: 'A' });
    await expect((async () => await serviceB.updateHousehold(household.id, { name: 'B' }))()).rejects.toThrowError(
      `Household with id ${household.id} not found`,
    );
    expect(await serviceA.getUserHouseholds()).toEqual([expect.objectContaining({ name: 'A' })]);
  });
  it('should not be possible to update a household as a member who is not the owner', async () => {
    const household = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household.id, ['B']);
    await serviceB.acceptInvitation(invitations[0].id);
    await expect(serviceB.updateHousehold(household.id, { name: 'B' })).rejects.toThrowError(
      `Household with id ${household.id} not found`,
    );
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
  it('should rethrow non-unique violation errors during invitation', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    // @ts-expect-error - passing null to trigger NOT NULL violation
    await expect(serviceA.inviteUsers(id, [null])).rejects.toThrow();
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
  it('should include pending invites and members in the update household response', async () => {
    const { id } = await serviceA.createHousehold({ name: 'A' });
    await serviceA.inviteUsers(id, ['B']);
    const updatedHousehold = await serviceA.updateHousehold(id, { name: 'C' });
    expect(updatedHousehold).toEqual(
      expect.objectContaining({
        name: 'C',
        pending_invites: [expect.objectContaining({ invited_user: 'B', household_id: id, invited_by_user_id: 'A' })],
        members: [expect.objectContaining({ user_id: 'A', household_id: id })],
      }),
    );
  });
  it('should update the updated_at time on patch', async () => {
    const { id, updated_at } = await serviceA.createHousehold({ name: 'A' });
    const { updated_at: new_updated_at } = await serviceA.updateHousehold(id, { name: 'C' });
    expect(updated_at).not.toEqual(new_updated_at);
  });
  it('should remove the pending invitation when user rejects invitation to household', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B']);
    await serviceB.deleteInvitation(invitations[0].id);
    const households = await serviceA.getUserHouseholds();
    expect(households).toEqual([expect.objectContaining({ name: 'A', pending_invites: [] })]);
  });
  it('should remove the pending invitation when the inviter revokes invitation', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B']);
    await serviceA.deleteInvitation(invitations[0].id);
    const households = await serviceA.getUserHouseholds();
    expect(households).toEqual([expect.objectContaining({ name: 'A', pending_invites: [] })]);
  });
  it('should not be possible to reject an invitation if you are not the invitee or inviter', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['C']);
    await serviceB.deleteInvitation(invitations[0].id);
    const households = await serviceA.getUserHouseholds();
    expect(households).toEqual([
      expect.objectContaining({ name: 'A', pending_invites: [expect.objectContaining({ invited_user: 'C' })] }),
    ]);
  });
  it('should add the user to the household members and remove the invitation when they accept', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B']);
    await serviceB.acceptInvitation(invitations[0].id);

    const households = await serviceA.getUserHouseholds();
    expect(households[0].pending_invites).toEqual([]);
    expect(households[0].members).toEqual(
      expect.arrayContaining([expect.objectContaining({ user_id: 'A' }), expect.objectContaining({ user_id: 'B' })]),
    );

    const householdsB = await serviceB.getUserHouseholds();
    expect(householdsB).toEqual([expect.objectContaining({ name: 'A' })]);
  });
  it('should throw an error if the user tries to accept an invitation that is not for them', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['C']);
    await expect(serviceB.acceptInvitation(invitations[0].id)).rejects.toThrowError(
      `Invitation with id ${invitations[0].id} not found`,
    );
  });
  it('should throw an error if the inviter tries to accept an invitation on the invitees behalf', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['C']);
    await expect(serviceA.acceptInvitation(invitations[0].id)).rejects.toThrowError('This invitation is not for you');
  });
  it('should throw an error if the invitation does not exist', async () => {
    await expect(serviceA.acceptInvitation(99999)).rejects.toThrowError('Invitation with id 99999 not found');
  });
  it('should throw an error if the household does not exist', async () => {
    await expect(serviceA.removeMember(99999, 8888)).rejects.toThrowError('Household with id 99999 not found');
  });
  it('should throw an error if the household does not contain the member', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    await expect(serviceA.removeMember(household_id, 8888)).rejects.toThrowError(
      `Member with id 8888 not found in household ${household_id}`,
    );
  });
  it('should throw an error if the member to be deleted is the creator of the household', async () => {
    const { id: household_id, members } = await serviceA.createHousehold({ name: 'A' });
    await expect(serviceA.removeMember(household_id, members[0].id)).rejects.toThrowError(
      'Cannot remove the creator of the household',
    );
  });
  it('should throw an error if the user is neither the creator nor the member to deleted', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B', 'C']);
    await serviceB.acceptInvitation(invitations[0].id);
    await serviceC.acceptInvitation(invitations[1].id);
    const { members } = await serviceA.getHousehold(household_id);
    await expect(
      serviceC.removeMember(household_id, members.find((member) => member.user_id === 'B').id),
    ).rejects.toThrowError('Only the household creator or the member themselves can remove a member');
  });
  it('should delete the member if the user is the creator', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B']);
    await serviceB.acceptInvitation(invitations[0].id);
    const { members } = await serviceA.getHousehold(household_id);
    await serviceA.removeMember(household_id, members.find((member) => member.user_id === 'B').id);
    const { members: updated_members } = await serviceA.getHousehold(household_id);
    expect(updated_members).toEqual([expect.objectContaining({ user_id: 'A' })]);
  });
  it('should delete the member if the user is the member', async () => {
    const { id: household_id } = await serviceA.createHousehold({ name: 'A' });
    const invitations = await serviceA.inviteUsers(household_id, ['B']);
    await serviceB.acceptInvitation(invitations[0].id);
    const { members } = await serviceA.getHousehold(household_id);
    await serviceB.removeMember(household_id, members.find((member) => member.user_id === 'B').id);
    const { members: updated_members } = await serviceA.getHousehold(household_id);
    expect(updated_members).toEqual([expect.objectContaining({ user_id: 'A' })]);
  });
}, 60000);
