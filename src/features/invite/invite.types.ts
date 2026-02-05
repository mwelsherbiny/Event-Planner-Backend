import type { EventRole, InviteStatus, Permission } from "@prisma/client";
import type { EventInviteData } from "../event/event.types.js";

export interface InviteData extends EventInviteData {
  id?: number;
  eventName: string;
}

export interface StoredInviteData {
  role: EventRole;
  status: InviteStatus;
  createdAt: Date;
  id: number;
  senderId: number;
  receiverId: number;
  eventId: number;
  permissions?: Permission[];
}

export type InviteRespondedStatus = Exclude<InviteStatus, "PENDING">;
