import { Request, Response } from 'express';

import { ManagementClient } from 'auth0';
import express from 'express';
const router = express.Router();

const management = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID ?? '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
  domain: process.env.AUTH0_DOMAIN ?? '',
});

router.get('/', async function (request: Request, response: Response) {
  const result = await management.users.get({
    id: request.auth?.payload.sub ?? '',
  });
  const {
    name,
    email,
    given_name,
    family_name,
    nickname,
    picture,
    user_metadata,
  } = result.data;
  console.log(`Get user info for ${email}`);
  response.json({
    name,
    email,
    given_name,
    family_name,
    nickname,
    picture,
    user_metadata,
  });
});

export default router;
