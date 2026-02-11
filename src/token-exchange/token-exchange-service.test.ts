import { decodeJwt, exportPKCS8, generateKeyPair } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../db-error-handling/db-errors.js';
import { TokenExchangeService } from './token-exchange-service.js';

const getUserHouseholdsMock = vi.hoisted(() => vi.fn());
vi.mock('../user-households/user-households-service.js', () => {
  const UserHouseholdsService = vi.fn(
    class {
      getUserHouseholds = getUserHouseholdsMock;
    },
  );
  return { UserHouseholdsService };
});

describe('TokenExchangeService', () => {
  const mockUser = 'test-user@example.com';
  let privateKey: string;

  beforeEach(async () => {
    const keys = await generateKeyPair('RS256', { extractable: true });
    privateKey = await exportPKCS8(keys.privateKey);
    vi.stubEnv('INTERNAL_JWT_PRIVATE_KEY', privateKey);
    vi.stubEnv('INTERNAL_JWT_PUBLIC_KEY', 'dummy-public-key');
  });

  it('should use "internal" as audience if none provided', async () => {
    const householdId = 123;
    getUserHouseholdsMock.mockResolvedValue([{ id: householdId }]);

    const service = new TokenExchangeService(mockUser);
    const token = await service.exchangeToken(householdId);

    const decoded = decodeJwt(token);
    expect(decoded.aud).toBe('internal');
  });

  it('should use provided audience', async () => {
    const householdId = 123;
    getUserHouseholdsMock.mockResolvedValue([{ id: householdId }]);

    const service = new TokenExchangeService(mockUser);
    const token = await service.exchangeToken(householdId, 'custom-audience');

    const decoded = decodeJwt(token);
    expect(decoded.aud).toBe('custom-audience');
  });

  it('should throw error if user does not have access to household', async () => {
    const householdId = 123;
    getUserHouseholdsMock.mockResolvedValue([{ id: 456 }]);

    const service = new TokenExchangeService(mockUser);
    await expect(service.exchangeToken(householdId)).rejects.toThrow(ForbiddenError);
    await expect(service.exchangeToken(householdId)).rejects.toThrow('User does not have access to this household');
  });

  it('should throw error if private key is not set', async () => {
    const householdId = 123;
    getUserHouseholdsMock.mockResolvedValue([{ id: householdId }]);
    vi.stubEnv('INTERNAL_JWT_PRIVATE_KEY', '');

    const service = new TokenExchangeService(mockUser);
    await expect(service.exchangeToken(householdId)).rejects.toThrow(
      'INTERNAL_JWT_PRIVATE_KEY environment variable not set',
    );
  });

  describe('getPublicKey', () => {
    it('should return the public key from env', () => {
      vi.stubEnv('INTERNAL_JWT_PUBLIC_KEY', 'test-public-key');
      expect(TokenExchangeService.getPublicKey()).toBe('test-public-key');
    });

    it('should throw error if public key is not set', () => {
      vi.stubEnv('INTERNAL_JWT_PUBLIC_KEY', '');
      expect(() => TokenExchangeService.getPublicKey()).toThrow('INTERNAL_JWT_PUBLIC_KEY environment variable not set');
    });
  });
});
