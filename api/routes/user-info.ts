import express, { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from 'express-oauth2-jwt-bearer';

import getUserInfo from './user-info-service.js';

const router = express.Router();

router.get(
  '/',
  async function (request: Request, response: Response, next: NextFunction) {
    if (request.auth?.payload.sub) {
      const userInfo = await getUserInfo(request.auth.payload.sub);
      console.log(`Get user info for ${userInfo.email}`);
      response.json(userInfo);
    } else {
      next(new UnauthorizedError('Invalid credentials'));
    }
  },
);

export default router;
