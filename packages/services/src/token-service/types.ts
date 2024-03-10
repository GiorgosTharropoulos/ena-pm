export interface TokenService {
  // sign({ id: invitation.id }) = 'lkasdjflkj=='
  sign(payload: unknown): string;
  verify(token: string): unknown;
}
