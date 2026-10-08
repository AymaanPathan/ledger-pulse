import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as transactionService from "../service/transaction.service";
import {
  serializeTransaction,
  VersionConflictError,
  VersionRequiredError,
} from "../service/transaction.service";

export const createTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: serializeTransaction(tx) });
  },
);

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await transactionService.listTransactions(
      req.query as unknown as transactionService.ListTransactionsQuery,
    );
    res.json({
      success: true,
      data: result.items.map(serializeTransaction),
      pagination: result.pagination,
    });
  },
);

export const getTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await transactionService.getTransactionById(req.params.id);
    res.json({ success: true, data: serializeTransaction(tx) });
  },
);

export const updateTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const tx = await transactionService.updateTransaction(
        req.params.id,
        req.body,
      );
      res.json({ success: true, data: serializeTransaction(tx) });
    } catch (err) {
      if (err instanceof VersionRequiredError) {
        return res.status(428).json({
          success: false,
          error: "Precondition required: 'version' is missing from the body",
        });
      }
      if (err instanceof VersionConflictError) {
        return res.status(409).json({
          success: false,
          error: "Version conflict: the record was modified by someone else",
          currentVersion: err.currentVersion,
        });
      }
      throw err;
    }
  },
);

export const deleteTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    await transactionService.deleteTransaction(req.params.id);
    res.status(204).send();
  },
);
