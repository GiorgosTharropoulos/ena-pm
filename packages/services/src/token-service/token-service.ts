export interface TokenService {
  sign(payload: unknown): Promise<string>;
  verify<T>(token: string): Promise<T>;
}

export class FakeTokenService implements TokenService {
  sign(payload: unknown): Promise<string> {
    return Promise.resolve(JSON.stringify(payload));
  }

  verify<T>(token: string): Promise<T> {
    return Promise.resolve(JSON.parse(token) as T);
  }
}
