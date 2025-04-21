import { ManagementClient } from 'auth0';

import { AvatarImageSource, UserInfo } from '../generated/types.js';

const management = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID ?? '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
  domain: process.env.AUTH0_DOMAIN ?? '',
});

const getUserInfo = async (userId: string): Promise<UserInfo> => {
  const result = await management.users.get({
    id: userId,
  });
  const { email, family_name, given_name, nickname, picture, user_metadata } =
    result.data;
  return {
    avatarImageSource: (user_metadata.avatarImageSource ??
      'GRAVATAR') as AvatarImageSource,
    email,
    firstName: (user_metadata.firstName ?? given_name) as string,
    gravatarEmailAddress: (user_metadata.gravatarEmailAddress ??
      email) as string,
    lastName: (user_metadata.lastName ?? family_name) as string,
    nickname: (user_metadata.nickname ?? nickname) as string,
    picture: (user_metadata.picture ?? picture) as string,
  };
};

export default getUserInfo;
