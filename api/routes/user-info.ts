import { Request, Response } from 'express';
import express from 'express';

import getUserInfo from './user-info-service.js';
const router = express.Router();

router.get('/', async function (request: Request, response: Response) {
  const userInfo = await getUserInfo(request.auth?.payload.sub ?? '');
  console.log(`Get user info for ${userInfo.email}`);
  response.json(userInfo);
});

export default router;
