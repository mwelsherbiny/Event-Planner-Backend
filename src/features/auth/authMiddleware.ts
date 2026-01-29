import type { Request, Response, NextFunction } from "express";
import { config } from "../../config/config.js";
import { throwMissingTokenError } from "../../errors/authErrors.js";
import { jwtVerify } from "./authUtil.js";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throwMissingTokenError();
  }

  const payload = jwtVerify(token, config.ACCESS_TOKEN_SECRET);
  req.payload = payload;

  next();
}
