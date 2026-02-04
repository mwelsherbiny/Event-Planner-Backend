import { randomUUID } from "crypto";
import type { EventStateContext } from "./event.types.js";
import { GeneratedEventState } from "./event.types.js";
import { EventState } from "@prisma/client";

export function getEventState(eventStateContext: EventStateContext) {
  if (eventStateContext.state === EventState.CANCELLED) {
    return GeneratedEventState.CANCELLED;
  }

  const now = Date.now();
  const start = eventStateContext.startAt.getTime();
  const end = start + eventStateContext.duration * 60000;

  if (now >= end) {
    return GeneratedEventState.COMPLETED;
  }

  if (now >= start) {
    return GeneratedEventState.ONGOING;
  }

  if (eventStateContext.currentAttendees >= eventStateContext.maxAttendees) {
    return GeneratedEventState.CLOSED_FOR_REGISTRATION;
  }

  return eventStateContext.state;
}

export function generateAttendanceCode(): string {
  return randomUUID();
}
