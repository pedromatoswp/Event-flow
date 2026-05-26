import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import { usersController } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, asyncHandler(usersController.meGet));
usersRouter.put("/me", requireAuth, asyncHandler(usersController.meUpdate));
usersRouter.delete("/me", requireAuth, asyncHandler(usersController.meDelete));

