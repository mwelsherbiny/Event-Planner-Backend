/* eslint-disable @typescript-eslint/no-explicit-any */
import "express";
import type { JwtPayload } from "../schemas/JwtPayloadSchema.ts";
import type { ZodType } from "zod";

declare module "express" {
  export interface Request {
    payload?: JwtPayload;
    parsedQuery?: unknown;
  }
}
