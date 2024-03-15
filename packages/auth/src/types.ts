export interface SetCookieOptions {
  maxAge: number;
  expires: Date;
  path: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "none" | "lax" | "strict";
}

export interface CookieStore {
  get: (key: string) => string | null;
  set: (key: string, value: string, options: Partial<SetCookieOptions>) => void;
  delete: (key: string) => void;
}
