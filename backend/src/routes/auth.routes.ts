import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));

