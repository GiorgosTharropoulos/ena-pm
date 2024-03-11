export interface TokenService {
  sign(payload: unknown): string;
  verify(token: string): unknown;
}

export class FakeTokenService implements TokenService {
  sign(payload: unknown): string {
    return JSON.stringify(payload);
  }

  verify(token: string): unknown {
    return JSON.parse(token);
  }
}
