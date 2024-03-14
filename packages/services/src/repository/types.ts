import type { Result } from "neverthrow";

export const NotFoundRepositoryError = {
  kind: "NOT_FOUND_REPOSITORY_ERROR ",
  message: "Not found",
} as const;
export const InsertFailedRepositoryError = {
  kind: "INSERTION_FAILED_REPOSITORY_ERROR",
  message: "Insert Failed",
} as const;
export type NotFoundRepositoryError = typeof NotFoundRepositoryError;
export type InsertFailedRepositoryError = typeof InsertFailedRepositoryError;

export interface Repository<TSelect, TInsert, TUpdate> {
  insert(data: TInsert): Promise<Result<TSelect, InsertFailedRepositoryError>>;
  update(
    ref: string,
    data: TUpdate,
  ): Promise<Result<TSelect, NotFoundRepositoryError>>;
  find(ref: string): Promise<Result<TSelect, NotFoundRepositoryError>>;
  remove(ref: string): Promise<Result<void, NotFoundRepositoryError>>;
}
