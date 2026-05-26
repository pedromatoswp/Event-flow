import { Router } from "express";

import { eventsController } from "../controllers/events.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

export const eventsRouter = Router();

eventsRouter.get("/", asyncHandler(eventsController.list));
eventsRouter.get("/:id", asyncHandler(eventsController.getById));

eventsRouter.post("/", requireAuth, requireAdmin, asyncHandler(eventsController.create));
eventsRouter.put("/:id", requireAuth, requireAdmin, asyncHandler(eventsController.update));
eventsRouter.delete("/:id", requireAuth, requireAdmin, asyncHandler(eventsController.remove));

