import "express";
import type { JwtPayload } from "../schemas/JwtPayloadSchema.ts";

declare module "express" {
  export interface Request {
    payload?: JwtPayload;
  }
}
