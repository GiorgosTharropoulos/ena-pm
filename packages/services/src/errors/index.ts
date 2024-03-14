export const createUnknownError = (error: unknown) =>
  ({
    kind: "UNKNOWN_ERROR",
    message: "Unknown Error",
    error,
  }) as const;

export type UnknownError = ReturnType<typeof createUnknownError>;
