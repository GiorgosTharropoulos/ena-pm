import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { Root } from "@ena/domain";

import type { InsertFailedRepositoryError, Repository } from "../types";
import { NotFoundRepositoryError } from "../types";

export class FakeRepository<TSelect extends Root, TInsert, TUpdate>
  implements Repository<TSelect, TInsert, TUpdate>
{
  constructor({
    seed,
    mapInsertValue,
  }: {
    seed?: TSelect[];
    mapInsertValue: (data: TInsert) => TSelect;
  }) {
    this.mapInsertValue = mapInsertValue;
    this.db = new Map(seed?.map((item) => [item.id, item]) ?? []);
  }

  public db: Map<Root["id"], TSelect>;
  private readonly mapInsertValue: (data: TInsert) => TSelect;

  insert(data: TInsert): Promise<Result<TSelect, InsertFailedRepositoryError>> {
    const mappedData = this.mapInsertValue(data);
    this.db.set(mappedData.id, mappedData);
    return Promise.resolve(ok(mappedData));
  }

  update(
    ref: string,
    data: TUpdate,
  ): Promise<Result<TSelect, NotFoundRepositoryError>> {
    const retrieved = this.db.get(ref);
    if (!retrieved) return Promise.resolve(err(NotFoundRepositoryError));
    this.db.set(retrieved.id, { ...retrieved, ...data });
    return Promise.resolve(ok(this.db.get(retrieved.id)!));
  }

  find(ref: string): Promise<Result<TSelect, NotFoundRepositoryError>> {
    const data = this.db.get(ref);
    if (!data) return Promise.resolve(err(NotFoundRepositoryError));
    return Promise.resolve(ok(data));
  }

  remove(ref: string): Promise<Result<void, NotFoundRepositoryError>> {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    if (!this.db.delete(ref))
      return Promise.resolve(err(NotFoundRepositoryError));
    return Promise.resolve(ok(undefined));
  }
}
