export const DATABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
};

export class DuplicateEntityError extends Error {
  constructor(message = 'Duplicate entity') {
    super(message);
  }
}
