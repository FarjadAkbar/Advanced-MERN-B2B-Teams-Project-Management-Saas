import { Router } from "express";
import {
  createEventController,
  deleteEventController,
  getAllEventsController,
  getEventByIdController,
  updateEventController,
} from "../controllers/event.controller";

const eventRoutes = Router();

eventRoutes.post(
  "/workspace/:workspaceId/create",
  createEventController
);

eventRoutes.delete("/:id/workspace/:workspaceId/delete", deleteEventController);

eventRoutes.put(
  "/:id/workspace/:workspaceId/update",
  updateEventController
);

eventRoutes.get("/workspace/:workspaceId/all", getAllEventsController);

eventRoutes.get(
  "/:id/workspace/:workspaceId",
  getEventByIdController
);

export default eventRoutes;
