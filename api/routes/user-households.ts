import { Router } from 'express';
import { UnauthorizedError } from 'express-oauth2-jwt-bearer';
import { UserHouseholdsService } from '../user-households/user-households-service.js';

const router = Router();

router.get('/', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    const households = await householdService.getUserHouseholds();
    response.status(200).json(households);
  } else {
    next(new UnauthorizedError('Invalid credentials'));
  }
});
router.post('/', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    const createdHousehold = await householdService.createHousehold(request.body);
    response.status(201).json(createdHousehold);
  } else {
    next(new UnauthorizedError('Invalid credentials'));
  }
});
router.delete('/:id', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    await householdService.deleteHousehold(Number(request.params.id));
    response.sendStatus(204);
  } else {
    next(new UnauthorizedError('Invalid credentials'));
  }
});

export default router;
