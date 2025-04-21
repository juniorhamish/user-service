import { ManagementClient } from 'auth0';
import { Mock } from 'vitest';

import { UserInfo, UserInfoInput } from '../generated/types.js';

const mockedAuth0Client = vi.hoisted(() => ({
  users: {
    get: vi.fn().mockResolvedValue({
      data: {
        user_metadata: {},
      },
    }),
    update: vi.fn().mockResolvedValue({
      data: {
        user_metadata: {},
      },
    }),
  },
}));

vi.mock('auth0', () => ({
  ManagementClient: vi.fn().mockReturnValue(mockedAuth0Client),
}));

describe('user info service', () => {
  afterEach(() => {
    vi.resetModules();
  });
  describe('instantiation', () => {
    it('should pass default values to the management client if not set in the environment variables', async () => {
      await import('./user-info-service.js');

      expect(vi.mocked(ManagementClient)).toHaveBeenCalledWith({
        clientId: '',
        clientSecret: '',
        domain: '',
      });
    });
    it('should configure the service with the props from environment variables', async () => {
      vi.stubEnv('AUTH0_CLIENT_ID', 'This is the client ID');
      vi.stubEnv('AUTH0_CLIENT_SECRET', 'This is the client secret');
      vi.stubEnv('AUTH0_DOMAIN', 'This is the domain');

      await import('./user-info-service.js');

      expect(vi.mocked(ManagementClient)).toHaveBeenCalledWith({
        clientId: 'This is the client ID',
        clientSecret: 'This is the client secret',
        domain: 'This is the domain',
      });
    });
  });
  describe('getUserInfo', () => {
    let getUserInfo: (userId: string) => Promise<UserInfo>;
    beforeEach(async () => {
      getUserInfo = (await import('./user-info-service.js')).getUserInfo;
    });
    it('should invoke the auth0 management API with the user ID', async () => {
      await getUserInfo('UserID');

      const auth0Client = vi.mocked(ManagementClient).mock.results[0].value as {
        users: { get: Mock };
      };
      expect(auth0Client.users.get).toHaveBeenCalledWith({ id: 'UserID' });
    });
    it('should set the firstName from the base response', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          given_name: 'David',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ firstName: 'David' }));
    });
    it('should set the lastName from the base response', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          family_name: 'Johnston',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ lastName: 'Johnston' }),
      );
    });
    it('should set the email from the base response', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          email: 'test@foo.com',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ email: 'test@foo.com' }),
      );
    });
    it('should set the nickname from the base response', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          nickname: 'DJ',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ nickname: 'DJ' }));
    });
    it('should set the picture from the base response', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          picture: 'picture',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ picture: 'picture' }));
    });
    it('should set the gravatarEmailAddress from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { gravatarEmailAddress: 'gravatar' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ gravatarEmailAddress: 'gravatar' }),
      );
    });
    it('should set the gravatarEmailAddress from the email if it is not present in the metadata', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          email: 'base_email',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ gravatarEmailAddress: 'base_email' }),
      );
    });
    it('should set the avatarImageSource from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { avatarImageSource: 'MANUAL' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ avatarImageSource: 'MANUAL' }),
      );
    });
    it('should set the avatarImageSource to gravatar if it is not present in the metadata', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(
        expect.objectContaining({ avatarImageSource: 'GRAVATAR' }),
      );
    });
  });
  describe('updateUserInfo', () => {
    let updateUserInfo: (
      userId: string,
      input: UserInfoInput,
    ) => Promise<UserInfo>;
    beforeEach(async () => {
      updateUserInfo = (await import('./user-info-service.js')).updateUserInfo;
    });
    it('should update the given_name using the first name from the request', async () => {
      await updateUserInfo('UserID', { firstName: 'David' });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          given_name: 'David',
          user_metadata: {},
        },
      );
    });
    it('should update the family_name using the last name from the request', async () => {
      await updateUserInfo('UserID', { lastName: 'Johnston' });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          family_name: 'Johnston',
          user_metadata: {},
        },
      );
    });
    it('should update the nickname using the nickname from the request', async () => {
      await updateUserInfo('UserID', { nickname: 'DJ' });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          nickname: 'DJ',
          user_metadata: {},
        },
      );
    });
    it('should update the picture using the picture from the request', async () => {
      await updateUserInfo('UserID', { picture: 'https://picture.com' });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          picture: 'https://picture.com',
          user_metadata: {},
        },
      );
    });
    it('should update the avatar image source in the meta_data using the source from the request', async () => {
      await updateUserInfo('UserID', { avatarImageSource: 'MANUAL' });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          user_metadata: { avatarImageSource: 'MANUAL' },
        },
      );
    });
    it('should update the gravatar email address in the meta_data using the gravatar email address from the request', async () => {
      await updateUserInfo('UserID', {
        gravatarEmailAddress: 'david@test.com',
      });

      expect(mockedAuth0Client.users.update).toHaveBeenCalledWith(
        { id: 'UserID' },
        {
          user_metadata: { gravatarEmailAddress: 'david@test.com' },
        },
      );
    });
  });
});
