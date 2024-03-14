import type { Result } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type {
  InvitationForCreate,
  InvitationForSelect,
  InvitationForUpdate,
} from "@ena/validators";
import { and, eq, schema } from "@ena/db";

import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "./types";
import { ModelRepository } from "./model-repository";

export interface InvitationRepository
  extends Repository<
    InvitationForSelect,
    InvitationForCreate,
    InvitationForUpdate
  > {
  findByTeamAndRecipient: (options: {
    to: string;
    teamKey: number;
  }) => Promise<InvitationForSelect | undefined>;
}

export class DrizzleInvitationRepository implements InvitationRepository {
  modelRepository: ModelRepository<"invitation">;

  constructor(private readonly db: DrizzleDB) {
    this.modelRepository = new ModelRepository(db, "invitation");
  }

  async insert(
    data: InvitationForCreate,
  ): Promise<Result<InvitationForSelect, InsertFailedRepositoryError>> {
    return this.modelRepository.insert(data);
  }

  async update(
    ref: string,
    data: InvitationForUpdate,
  ): Promise<Result<InvitationForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.update(ref, data);
  }

  async remove(ref: string): Promise<Result<void, NotFoundRepositoryError>> {
    return this.modelRepository.remove(ref);
  }

  async find(
    ref: string,
  ): Promise<Result<InvitationForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.find(ref);
  }

  async findByTeamAndRecipient(options: {
    to: string;
    teamKey: number;
  }): Promise<InvitationForSelect | undefined> {
    return this.db.query.invitation.findFirst({
      where: and(
        eq(schema.invitation.to, options.to),
        eq(schema.invitation.teamKey, options.teamKey),
      ),
    });
  }
}
