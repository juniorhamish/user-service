import { Router } from 'express';
import createError from 'http-errors';
import { ForbiddenError } from '../db-error-handling/db-errors.js';
import { TokenExchangeService } from '../token-exchange/token-exchange-service.js';

const router = Router();

router.post('/exchange', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (!userId) {
    return next(createError(401, 'Invalid credentials'));
  }

  const { household_id, audience } = request.body;
  if (!household_id) {
    return next(createError(400, 'household_id is required'));
  }

  try {
    const tokenService = new TokenExchangeService(userId);
    const token = await tokenService.exchangeToken(household_id, audience);
    response.status(200).json({ token });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      next(createError(403, error.message));
    } else if (error instanceof Error) {
      next(createError(500, error.message));
    } else {
      next(createError(500, 'An unknown error occurred.'));
    }
  }
});

router.get('/public-key', (_request, response, next) => {
  try {
    const publicKey = TokenExchangeService.getPublicKey();
    response.status(200).json({ publicKey });
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(createError(500, error.message));
    } else {
      next(createError(500, 'An unknown error occurred.'));
    }
  }
});

export default router;
