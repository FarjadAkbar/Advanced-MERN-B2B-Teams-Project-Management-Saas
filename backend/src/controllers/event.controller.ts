import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  createEventSchema,
  eventIdSchema,
  updateEventSchema,
} from "../validation/event.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import {
  createEventService,
  deleteEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
} from "../services/event.service";
import { HTTPSTATUS } from "../config/http.config";

export const createEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = createEventSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_EVENT]);

    const { event } = await createEventService(
      workspaceId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting scheduled successfully",
      event,
    });
  }
);

export const updateEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = updateEventSchema.parse(req.body);

    const eventId = eventIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_EVENT]);

    const { updatedEvent } = await updateEventService(
      workspaceId,
      eventId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting rescheduled successfully",
      event: updatedEvent,
    });
  }
);

export const getAllEventsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const filters = {
      attendees: req.query.attendees
        ? (req.query.attendees as string)?.split(",")
        : undefined,
      keyword: req.query.keyword as string | undefined,
      date: req.query.date as string | undefined,
    };

    const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllEventsService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "All events fetched successfully",
      ...result,
    });
  }
);

export const getEventByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const eventId = eventIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const event = await getEventByIdService(workspaceId, eventId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Event fetched successfully",
      event,
    });
  }
);

export const deleteEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const eventId = eventIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_EVENT]);

    await deleteEventService(workspaceId, eventId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting cancelled successfully",
    });
  }
);
