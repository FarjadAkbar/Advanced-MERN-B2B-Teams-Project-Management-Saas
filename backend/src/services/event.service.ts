import MemberModel from "../models/member.model";
import EventModel from "../models/event.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const createEventService = async (
  workspaceId: string,
  userId: string,
  body: {
    title: string;
    agenda?: string;
    date: string;
    time: string;
    duration: string;
    attendees: string[];
    meetingLink: string;
  }
) => {
  const { title, agenda, date, duration, time, attendees, meetingLink } = body;

  const event = new EventModel({
    title,
    agenda,
    date,
    time,
    duration,
    attendees,
    meetingLink,
    createdBy: userId,
    workspace: workspaceId,
  });

  await event.save();

  return { event };
};

export const updateEventService = async (
  workspaceId: string,
  eventId: string,
  body: {
    title?: string;
    agenda?: string;
    date?: string;
    time?: string;
    duration?: string;
    attendees?: string[];
    meetingLink?: string;
  }
) => {
  const event = await EventModel.findById(eventId);

  if (!event) {
    throw new NotFoundException("Event not found.");
  }

  if (event.workspace?.toString() !== workspaceId) {
    throw new BadRequestException("Event does not belong to this workspace");
  }

  const updatedEvent = await EventModel.findByIdAndUpdate(
    eventId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedEvent) {
    throw new BadRequestException("Failed to update event");
  }

  return { updatedEvent };
};

export const getAllEventsService = async (
  workspaceId: string,
  filters: {
    attendees?: string[];
    keyword?: string;
    date?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.attendees && filters.attendees?.length > 0) {
    query.attendees = { $in: filters.attendees };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.date) {
    query.date = {
      $eq: filters.date,
    };
  }

  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [events, totalCount] = await Promise.all([
    EventModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("attendees", "_id name profilePicture -password"),
    EventModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    events,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getEventByIdService = async (
  workspaceId: string,
  eventId: string
) => {
  const event = await EventModel.findOne({
    _id: eventId,
    workspace: workspaceId,
  }).populate("attendees", "_id name profilePicture -password");

  if (!event) {
    throw new NotFoundException("Event not found.");
  }

  return event;
};

export const deleteEventService = async (
  workspaceId: string,
  eventId: string
) => {
  const event = await EventModel.findOneAndDelete({
    _id: eventId,
    workspace: workspaceId,
  });

  if (!event) {
    throw new NotFoundException(
      "Event not found or does not belong to the specified workspace"
    );
  }

  return;
};