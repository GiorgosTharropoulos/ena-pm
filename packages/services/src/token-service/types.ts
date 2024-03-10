export interface TokenService {
  sing(payload: unknown): string;
  verify(token: string): unknown;
}
