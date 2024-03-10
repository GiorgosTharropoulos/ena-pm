import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";

export interface InvitationRepository {
  findById(id: number): Promise<Invitation | undefined>;
  create(invitationIn: InvitationForCreate): Promise<Invitation>;
  setToken(id: number, token: string): Promise<Invitation>;
}
