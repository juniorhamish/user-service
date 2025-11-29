import { type Management, ManagementClient } from 'auth0';

import type { AvatarImageSource, PatchUserInfo, UserInfo } from '../types/UserInfo.js';

const management = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID ?? '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
  domain: process.env.AUTH0_DOMAIN ?? '',
});

const buildResponse = (result: Management.GetUserResponseContent): UserInfo => {
  const { email, family_name, given_name, nickname, picture, user_metadata } = result;
  return {
    avatarImageSource: (user_metadata?.avatarImageSource ?? 'GRAVATAR') as AvatarImageSource,
    email: email ?? '',
    firstName: given_name ?? '',
    gravatarEmailAddress: (user_metadata?.gravatarEmailAddress ?? email) as string,
    lastName: family_name ?? '',
    nickname: nickname ?? '',
    picture: picture ?? '',
  };
};

const getUserInfo = async (userId: string): Promise<UserInfo> => {
  const result = await management.users.get(userId);
  return buildResponse(result);
};
const updateUserInfo = async (
  userId: string,
  { avatarImageSource, firstName, gravatarEmailAddress, lastName, nickname, picture }: PatchUserInfo,
): Promise<UserInfo> => {
  const result = await management.users.update(userId, {
    family_name: lastName,
    given_name: firstName,
    nickname,
    picture,
    user_metadata: { avatarImageSource, gravatarEmailAddress },
  });
  return buildResponse(result);
};

export { getUserInfo, updateUserInfo };
