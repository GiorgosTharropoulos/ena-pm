import type { Result } from "neverthrow";
import { err, errAsync, ok, okAsync } from "neverthrow";

import type { DrizzleDB, PgUpdateSetSource, SchemaTables } from "@ena/db";
import { eq, schema } from "@ena/db";

import { InsertFailedRepositoryError, NotFoundRepositoryError } from "./types";

export class ModelRepository<TTableName extends keyof SchemaTables> {
  protected readonly table: SchemaTables[TTableName];
  constructor(
    protected readonly db: DrizzleDB,
    protected readonly tableName: TTableName,
  ) {
    this.table = schema[tableName];
  }

  async insert(
    data: SchemaTables[TTableName]["$inferInsert"],
  ): Promise<
    Result<
      SchemaTables[TTableName]["$inferSelect"],
      InsertFailedRepositoryError
    >
  > {
    const rows = await this.db.insert(this.table).values(data).returning();

    const inserted = rows.at(0);

    if (!inserted) return errAsync(InsertFailedRepositoryError);

    return okAsync(inserted);
  }

  async update(
    ref: string,
    value: PgUpdateSetSource<SchemaTables[TTableName]>,
  ): Promise<
    Result<SchemaTables[TTableName]["$inferSelect"], NotFoundRepositoryError>
  > {
    const rows = await this.db
      .update(this.table)
      .set(value)
      .where(eq(this.table.ref, ref))
      .returning();

    const model = rows.at(0);

    if (!model) return err(NotFoundRepositoryError);

    return ok(model);
  }

  async find(
    ref: string,
  ): Promise<
    Result<SchemaTables[TTableName]["$inferSelect"], NotFoundRepositoryError>
  > {
    const row = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.ref, ref))
      .limit(1);

    const model = row.at(0);

    if (!model) return err(NotFoundRepositoryError);

    return ok(model as never);
  }

  async remove(ref: string): Promise<Result<void, NotFoundRepositoryError>> {
    const removed = await this.db
      .delete(this.table)
      .where(eq(this.table.ref, ref))
      .returning({ id: this.table.ref })
      .then((r) => r.at(0));

    if (!removed) return err(NotFoundRepositoryError);
    return ok(undefined);
  }
}
