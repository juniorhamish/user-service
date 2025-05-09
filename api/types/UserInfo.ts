export enum AvatarImageSource {
  GRAVATAR = 'GRAVATAR',
  MANUAL = 'MANUAL',
}

export type PatchUserInfo = Partial<UserInfo>;

export interface UserInfo {
  avatarImageSource: AvatarImageSource;
  email: string;
  firstName: string;
  gravatarEmailAddress: string;
  lastName: string;
  nickname: string;
  picture: string;
}
