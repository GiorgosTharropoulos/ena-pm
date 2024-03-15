export const createUnknownError = (unsafeError: unknown) =>
  ({
    kind: "UNKNOWN_ERROR",
    message: "Unknown Error",
    unsafeError,
  }) as const;

export type UnknownError = ReturnType<typeof createUnknownError>;
