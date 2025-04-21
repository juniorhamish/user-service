import { Resolvers } from './generated/types.js';
import { getUserInfo, updateUserInfo } from './user-info/user-info-service.js';

export const resolvers: Resolvers = {
  Mutation: {
    updateUserInfo: async (_, { input }, context) => {
      if (!context.userId) {
        throw new Error('Invalid credentials');
      }
      if (!input) {
        throw new Error('Invalid input');
      }
      const userInfo = await updateUserInfo(context.userId, input);
      console.log(
        `Update user info for ${userInfo.email?.toString() ?? 'unknown user'}`,
      );
      return userInfo;
    },
  },
  Query: {
    getUserInfo: async (_parent, _args, context) => {
      if (!context.userId) {
        throw new Error('Invalid credentials');
      }
      const userInfo = await getUserInfo(context.userId);
      console.log(
        `Get user info for ${userInfo.email?.toString() ?? 'unknown user'}`,
      );
      return userInfo;
    },
  },
};
