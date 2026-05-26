import { Router } from "express";

import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { usersRouter } from "./users.routes";
import { eventsRouter } from "./events.routes";
import { ticketsRouter } from "./tickets.routes";
import { categoriesRouter } from "./categories.routes";
import { commentsRouter } from "./comments.routes";
import { ratingsRouter } from "./ratings.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/tickets", ticketsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/comments", commentsRouter);
apiRouter.use("/ratings", ratingsRouter);
apiRouter.use("/admin", adminRouter);

