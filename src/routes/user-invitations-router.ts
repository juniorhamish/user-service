import { Router } from 'express';
import createError from 'http-errors';
import { ForbiddenError, NotFoundError } from '../db-error-handling/supabase-errors.js';
import { UserHouseholdsService } from '../user-households/user-households-service.js';

const router = Router();

router.delete('/:invitationId', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    try {
      await householdService.deleteInvitation(Number(request.params.invitationId));
      response.status(204).end();
    } catch (error) {
      if (error instanceof Error) {
        next(createError(500, error.message));
      } else {
        next(createError(500, 'An unknown error occurred.'));
      }
    }
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});

router.post('/:invitationId/accept', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    try {
      await householdService.acceptInvitation(Number(request.params.invitationId));
      response.status(204).end();
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(createError(404, error.message));
      } else if (error instanceof ForbiddenError) {
        next(createError(403, error.message));
      } else if (error instanceof Error) {
        next(createError(500, error.message));
      } else {
        next(createError(500, 'An unknown error occurred.'));
      }
    }
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});

export default router;
