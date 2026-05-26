import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";
import { categoriesController } from "../controllers/categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(categoriesController.list));
categoriesRouter.get("/:id", asyncHandler(categoriesController.getById));

categoriesRouter.post("/", requireAuth, requireAdmin, asyncHandler(categoriesController.create));
categoriesRouter.put("/:id", requireAuth, requireAdmin, asyncHandler(categoriesController.update));
categoriesRouter.delete("/:id", requireAuth, requireAdmin, asyncHandler(categoriesController.remove));

