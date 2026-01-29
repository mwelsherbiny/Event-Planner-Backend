import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { throwInvalidDataError } from "../../errors/authErrors.js";

export default function validateData(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        code: e.code,
      }));

      throwInvalidDataError(errors);
    }

    req.body = result.data;
    next();
  };
}
