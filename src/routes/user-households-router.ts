import { Router } from 'express';
import createError from 'http-errors';
import { DuplicateEntityError, InvitedUserIsOwnerError, NotFoundError } from '../db-error-handling/supabase-errors.js';
import { type HouseholdInvitation, UserHouseholdsService } from '../user-households/user-households-service.js';

const router = Router();

router.get('/', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    const households = await householdService.getUserHouseholds();
    response.status(200).json(households);
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});
router.post('/', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    try {
      const createdHousehold = await householdService.createHousehold(request.body);
      response.status(201).json(createdHousehold);
    } catch (error: unknown) {
      if (error instanceof DuplicateEntityError) {
        next(createError(409, error.message));
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
router.delete('/:id', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    await householdService.deleteHousehold(Number(request.params.id));
    response.sendStatus(204);
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});
router.patch('/:id', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    try {
      const updatedHousehold = await householdService.updateHousehold(Number(request.params.id), request.body);
      response.status(200).json(updatedHousehold);
    } catch (error) {
      if (error instanceof DuplicateEntityError) {
        next(createError(409, error.message));
      } else if (error instanceof NotFoundError) {
        next(createError(404, error.message));
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
router.post('/:id/invitations', async (request, response, next) => {
  const userId = request.auth?.payload.email as string;
  if (userId) {
    const invitedUserEmails = new Set<string>(request.body.map((invite: HouseholdInvitation) => invite.invited_user));
    if (invitedUserEmails.size === request.body.length) {
      const householdService = new UserHouseholdsService(userId);
      try {
        const createdInvitations = await householdService.inviteUsers(
          Number(request.params.id),
          Array.from(invitedUserEmails),
        );
        response.status(201).json(createdInvitations);
      } catch (error) {
        if (error instanceof InvitedUserIsOwnerError) {
          next(createError(400, error.message));
        } else if (error instanceof Error) {
          next(createError(500, error.message));
        } else {
          next(createError(500, 'An unknown error occurred.'));
        }
      }
    } else {
      next(createError(400, 'Request body includes the same email address multiple times'));
    }
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});
export default router;
