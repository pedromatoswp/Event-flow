import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import { commentsController } from "../controllers/comments.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const commentsRouter = Router();

commentsRouter.get("/events/:eventId", asyncHandler(commentsController.listByEvent));

commentsRouter.post(
  "/events/:eventId",
  requireAuth,
  asyncHandler(commentsController.create)
);

commentsRouter.put("/:commentId", requireAuth, asyncHandler(commentsController.update));
commentsRouter.delete("/:commentId", requireAuth, asyncHandler(commentsController.remove));

