import type { Event, Prisma } from "@prisma/client";
import type { EventInviteRequest, QueryEventsRequest } from "./event.schema.js";

export enum EventSortableFields {
  START_AT_ASC = "startAt",
  START_AT_DESC = "-startAt",
  PRICE_ASC = "price",
  PRICE_DESC = "-price",
}

export type SortField = "startAt" | "price";

export type SortOrder = "asc" | "desc";

export type EventStateContext = Pick<
  Event,
  "state" | "startAt" | "duration" | "maxAttendees"
> & { currentAttendees: number };

export enum GeneratedEventState {
  OPEN_FOR_REGISTRATION = "OPEN_FOR_REGISTRATION",
  CLOSED_FOR_REGISTRATION = "CLOSED_FOR_REGISTRATION",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type CreateEventData = Omit<
  Event,
  "id" | "ownerId" | "createdAt" | "updatedAt" | "state"
>;

export type QueryEventsData = Omit<QueryEventsRequest, "sort"> & {
  sortOrder: SortOrder;
  sortField: SortField;
};

export interface EventSearchEntry {
  id: number;
  name: string;
  startAt: Date;
  duration: number;
  price: Prisma.Decimal | null;
  maxAttendees: number;
  governorate: string;
  imageUrl: string | null;
  currentAttendees: number;
}

export type EventInviteData = EventInviteRequest & {
  senderId: number;
  eventId: number;
};
