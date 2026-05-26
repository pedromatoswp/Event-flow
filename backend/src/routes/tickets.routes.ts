import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";
import { ticketsController } from "../controllers/tickets.controller";

export const ticketsRouter = Router();

ticketsRouter.post("/purchase", requireAuth, asyncHandler(ticketsController.purchase));
ticketsRouter.get("/me", requireAuth, asyncHandler(ticketsController.listMine));
ticketsRouter.get("/:id", requireAuth, asyncHandler(ticketsController.getById));
ticketsRouter.put("/:id/status", requireAuth, requireAdmin, asyncHandler(ticketsController.setStatus));
ticketsRouter.delete("/:id", requireAuth, asyncHandler(ticketsController.cancelByOwner));

