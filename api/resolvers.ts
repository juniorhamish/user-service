import { Resolvers } from './generated/types.js';
import getUserInfo from './user-info/user-info-service.js';

export const resolvers: Resolvers = {
  Query: {
    getUserInfo: async (_args, context: Record<PropertyKey, string>) => {
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
