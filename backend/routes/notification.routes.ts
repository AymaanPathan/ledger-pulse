import { Router } from "express";
import * as controller from "../controllers/notification.controller";

const router = Router();

router.get("/", controller.listNotifications);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);

export default router;
