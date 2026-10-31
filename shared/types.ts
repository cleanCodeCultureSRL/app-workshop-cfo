// Shared between server and client. Server is content-agnostic:
// it only stores step ids, field values, signed snapshots and presence.

export type Role = "teacher" | "participant";

/** O versiune semnată a Contractului cu firma: fotografia câmpurilor (inclusiv `fn.state`) din momentul semnării. */
export interface SignedAct {
  version: number;
  at: number;
  fields: Record<string, string>;
}

export interface Participant {
  id: string;
  name: string;
  firm: string;
  stepId: string | null;
  following: boolean;
  fields: Record<string, string>;
  acts: SignedAct[];
  stuck: boolean;
  stuckSince: number | null;
  online: boolean;
  lastSeen: number;
  joinedAt: number;
}

export interface PresenterState {
  stepId: string | null;
  updatedAt: number;
  /** Cel mai avansat pas la care a ajuns prezentatorul în sesiunea asta. Participanții nu pot trece de el. */
  maxStepId: string | null;
}

// ---- client -> server
export type ClientMessage =
  | { type: "hello"; role: "participant"; id?: string; name: string; firm: string }
  | { type: "hello"; role: "teacher"; pin: string }
  | { type: "presenter:set"; stepId: string; maxStepId: string | null }
  | {
      type: "participant:update";
      patch: Partial<Pick<Participant, "stepId" | "following" | "stuck" | "name" | "firm">> & {
        fields?: Record<string, string>;
      };
    }
  /** Participantul semnează contractul: serverul îngheață câmpurile curente ca versiune nouă. */
  | { type: "participant:sign" }
  | { type: "presenter:reset" }
  | { type: "ping" };

// ---- server -> client
export type ServerMessage =
  | { type: "welcome"; role: Role; id: string; presenter: PresenterState; me?: Participant; participants?: Participant[] }
  | { type: "error"; message: string }
  | { type: "presenter"; presenter: PresenterState }
  | { type: "participants"; participants: Participant[] }
  | { type: "me"; me: Participant }
  | { type: "notice"; text: string; from: "system" }
  /** Sesiunea a fost resetată de la zero: participanții își golesc datele locale și reintră; prezentatorul revine la primul pas. */
  | { type: "reset" }
  | { type: "pong" };
