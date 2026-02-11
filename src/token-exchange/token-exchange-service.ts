import { importPKCS8, SignJWT } from 'jose';
import { ForbiddenError } from '../db-error-handling/db-errors.js';
import { UserHouseholdsService } from '../user-households/user-households-service.js';

export class TokenExchangeService {
  private readonly user: string;

  constructor(user: string) {
    this.user = user;
  }

  async exchangeToken(householdId: number, audience = 'internal'): Promise<string> {
    // Verify user has access to this household
    const householdService = new UserHouseholdsService(this.user);
    const households = await householdService.getUserHouseholds();

    const hasAccess = households.some((h) => h.id === householdId);
    if (!hasAccess) {
      throw new ForbiddenError('User does not have access to this household');
    }

    // Load the private key for signing
    const privateKeyPem = process.env.INTERNAL_JWT_PRIVATE_KEY;
    if (!privateKeyPem) {
      throw new Error('INTERNAL_JWT_PRIVATE_KEY environment variable not set');
    }

    const privateKey = await importPKCS8(privateKeyPem, 'RS256');

    // Generate internal JWT with household_id claim
    return await new SignJWT({
      email: this.user,
      household_id: householdId,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer('user-service')
      .setAudience(audience)
      .setExpirationTime('15m')
      .sign(privateKey);
  }

  static getPublicKey(): string {
    const publicKey = process.env.INTERNAL_JWT_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('INTERNAL_JWT_PUBLIC_KEY environment variable not set');
    }
    return publicKey;
  }
}
