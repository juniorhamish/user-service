import { ManagementClient } from 'auth0';
import { Mock } from 'vitest';

import { UserInfo } from '../generated/types.js';

const mockedAuth0Client = vi.hoisted(() => ({
  users: {
    get: vi.fn().mockResolvedValue({
      data: {
        email: '',
        family_name: '',
        given_name: '',
        nickname: '',
        user_metadata: '',
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
      getUserInfo = (await import('./user-info-service.js')).default;
    });
    it('should invoke the auth0 management API with the user ID', async () => {
      await getUserInfo('UserID');

      const auth0Client = vi.mocked(ManagementClient).mock.results[0].value as {
        users: { get: Mock };
      };
      expect(auth0Client.users.get).toHaveBeenCalledWith({ id: 'UserID' });
    });
    it('should set the firstName from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { firstName: 'Dave' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ firstName: 'Dave' }));
    });
    it('should set the firstName from the base response if it is not present in the metadata', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          given_name: 'David',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ firstName: 'David' }));
    });
    it('should set the lastName from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { lastName: 'Smith' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ lastName: 'Smith' }));
    });
    it('should set the lastName from the base response if it is not present in the metadata', async () => {
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
    it('should set the nickname from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { nickname: 'Dave' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ nickname: 'Dave' }));
    });
    it('should set the nickname from the base response if it is not present in the metadata', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          nickname: 'DJ',
          user_metadata: {},
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ nickname: 'DJ' }));
    });
    it('should set the picture from the metadata if it is present', async () => {
      mockedAuth0Client.users.get.mockResolvedValue({
        data: {
          user_metadata: { picture: 'Dave' },
        },
      });

      const userInfo = await getUserInfo('');

      expect(userInfo).toEqual(expect.objectContaining({ picture: 'Dave' }));
    });
    it('should set the picture from the base response if it is not present in the metadata', async () => {
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
});
