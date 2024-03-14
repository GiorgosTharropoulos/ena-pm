import type { DrizzleDB } from "@ena/db";

import type {
  EmailRepository,
  OrganizationRepository,
  TeamRepository,
  UserRepository,
} from "../repository";
import {
  DrizzleEmailRepository,
  DrizzleOrganizationRepository,
  DrizzleTeamRepository,
  DrizzleUserRepository,
} from "../repository";

export interface UnitOfWork {
  transaction<U>(cb: (args: Transaction) => Promise<U>): Promise<U>;
}

export interface RepositoriesMap {
  team: TeamRepository;
  organization: OrganizationRepository;
  email: EmailRepository;
  user: UserRepository;
}

export interface Transaction {
  repository: Readonly<RepositoriesMap>;
  rollback: () => Promise<void>;
}

type DrizzleTransaction = Parameters<
  Parameters<DrizzleDB["transaction"]>[0]
>[0];

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: DrizzleDB) {}

  private createRepositories(
    tx: DrizzleTransaction,
  ): Readonly<RepositoriesMap> {
    const map = {} as RepositoriesMap;

    return {
      get email() {
        if (map.email) return map.email;
        const repo = new DrizzleEmailRepository(tx);
        map.email = repo;
        return repo;
      },
      get organization() {
        if (map.organization) return map.organization;
        const repo = new DrizzleOrganizationRepository(tx);
        map.organization = repo;
        return repo;
      },
      get team() {
        if (map.team) return map.team;
        const repo = new DrizzleTeamRepository(tx);
        map.team = repo;
        return repo;
      },
      get user() {
        if (map.user) return map.user;
        const repo = new DrizzleUserRepository(tx);
        map.user = repo;
        return repo;
      },
    };
  }

  transaction<U>(cb: (args: Transaction) => Promise<U>): Promise<U> {
    return this.db.transaction((tx) => {
      const repository = this.createRepositories(tx);
      return cb({
        repository,
        rollback: () => tx.rollback(),
      });
    });
  }
}
