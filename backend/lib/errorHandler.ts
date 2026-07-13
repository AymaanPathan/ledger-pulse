import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";

export function notFoundHandler(req: Request, res: Response) {
  res
    .status(404)
    .json({
      success: false,
      message: `Route ${req.method} ${req.path} not found`,
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("[error]", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Prisma-specific errors get translated into sane HTTP responses instead of
  // leaking a raw stack trace / SQL error to the client.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({
          success: false,
          message: "Duplicate record",
          details: err.meta,
        });
    }
    return res
      .status(400)
      .json({
        success: false,
        message: "Database request error",
        details: err.meta,
      });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res
      .status(400)
      .json({ success: false, message: "Malformed JSON body" });
  }

  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
}
