import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as transactionService from "../service/transaction.service";

export const createTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: tx });
  },
);

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await transactionService.listTransactions(
      req.query as unknown as transactionService.ListTransactionsQuery,
    );
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const getTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await transactionService.getTransactionById(req.params.id);
    res.json({ success: true, data: tx });
  },
);

export const updateTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await transactionService.updateTransaction(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: tx });
  },
);

export const deleteTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    await transactionService.deleteTransaction(req.params.id);
    res.status(204).send();
  },
);
