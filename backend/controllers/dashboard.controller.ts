import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { getDashboardSummary } from "../service/dashboard.service";

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await getDashboardSummary();
  res.json({ success: true, data: summary });
});
