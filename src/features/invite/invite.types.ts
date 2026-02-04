import type { EventInviteData } from "../event/event.types.js";

export interface InviteData extends EventInviteData {
  id?: number;
  eventName: string;
}
