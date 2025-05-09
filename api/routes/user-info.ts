import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import { UnauthorizedError } from 'express-oauth2-jwt-bearer';

import { PatchUserInfo, UserInfo } from '../types/UserInfo.js';
import { getUserInfo, updateUserInfo } from '../user-info/user-info-service.js';

const router = express.Router();

const handleRequest = async (
  request: Request<Record<string, unknown>, unknown, PatchUserInfo | UserInfo>,
  response: Response,
  next: NextFunction,
  serviceFunction: (userId: string) => Promise<UserInfo>,
) => {
  if (request.auth?.payload.sub) {
    const userInfo = await serviceFunction(request.auth.payload.sub);
    console.log(`Handle user info for ${userInfo.email}`);
    response.json(userInfo);
  } else {
    next(new UnauthorizedError('Invalid credentials'));
  }
};

router.get('/', async function (
  request: Request<Record<string, unknown>, unknown, UserInfo>,
  response: Response,
  next: NextFunction,
) {
  await handleRequest(request, response, next, (userId) => getUserInfo(userId));
} as RequestHandler);

router.patch('/', async function (
  request: Request<Record<string, unknown>, unknown, PatchUserInfo>,
  response: Response,
  next: NextFunction,
) {
  await handleRequest(request, response, next, (userId) =>
    updateUserInfo(userId, request.body),
  );
} as RequestHandler);

export default router;
