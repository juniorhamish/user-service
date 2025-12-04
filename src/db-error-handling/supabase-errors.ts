export const DATABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
};

export class DuplicateEntityError extends Error {
  constructor(message = 'Duplicate entity') {
    super(message);
  }
}

export class InvitedUserIsOwnerError extends Error {
  constructor(message = 'The invited user is already the owner of the household') {
    super(message);
  }
}

export class NotFoundError extends Error {
  constructor(message = 'The requested entity was not found') {
    super(message);
  }
}
