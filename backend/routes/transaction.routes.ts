import { Router } from "express";
import { validate } from "../lib/validate";
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from "../lib/transaction.validator";
import * as controller from "../controllers/transaction.controller";

const router = Router();

router.post(
  "/",
  validate(createTransactionSchema),
  controller.createTransaction,
);
router.get("/", validate(listTransactionsSchema), controller.listTransactions);
router.get("/:id", validate(idParamSchema), controller.getTransaction);
router.put(
  "/:id",
  validate(updateTransactionSchema),
  controller.updateTransaction,
);
router.delete("/:id", validate(idParamSchema), controller.deleteTransaction);

export default router;
