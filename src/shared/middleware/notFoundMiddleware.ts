import type { NextFunction, Request, Response } from "express";

export default function (req: Request, res: Response, _next: NextFunction) {
  return res.status(404).json({
    success: false,
    error: "Route not found",
  });
}
