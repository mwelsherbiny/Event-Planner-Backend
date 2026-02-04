import type { Request, Response, NextFunction } from "express";

import { z } from "zod";
import { throwInvalidDataError } from "../../errors/auth.errors.js";

export function validateData(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        code: e.code === "custom" ? e.params?.code || "invalid" : e.code,
      }));

      throwInvalidDataError(errors);
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        code: e.code === "custom" ? e.params?.code || "invalid" : e.code,
      }));

      throwInvalidDataError(errors);
    }

    req.parsedQuery = result.data;
    next();
  };
}
