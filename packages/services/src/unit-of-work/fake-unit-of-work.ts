import type { RepositoriesMap, Transaction, UnitOfWork } from ".";
import {
  FakeEmailRepository,
  FakeOrganizationRepository,
  FakeTeamRepository,
  FakeUserRepository,
} from "../repository/fakes";

export class FakeUnitOfWork implements UnitOfWork {
  public readonly repositories: RepositoriesMap;
  public isRollbacked = false;
  constructor(repositories: Partial<RepositoriesMap> = {}) {
    this.repositories = {
      email: repositories.email ?? new FakeEmailRepository(),
      organization:
        repositories.organization ?? new FakeOrganizationRepository(),
      team: repositories.team ?? new FakeTeamRepository(),
      user: repositories.user ?? new FakeUserRepository(),
    };
  }

  transaction<U>(cb: (args: Transaction) => Promise<U>): Promise<U> {
    return cb({
      repository: this.repositories,
      rollback: async () => {
        this.isRollbacked = true;
        return Promise.resolve();
      },
    });
  }
}
