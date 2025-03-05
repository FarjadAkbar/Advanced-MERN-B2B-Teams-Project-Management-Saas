import { z } from "zod";

export const titleSchema = z.string().trim().min(1).max(255);
export const agendaSchema = z.string().trim().optional(); // Allow optional agenda
export const dateSchema = z.string();
export const timeSchema = z.string();
export const durationSchema = z.string().trim().min(1);
export const attendeesSchema = z.array(z.string().trim().min(1));
export const meetingLinkSchema = z.string().trim().url(); // Assuming meetingLink should be a URL

export const eventIdSchema = z.string().trim().min(1);
export const createEventSchema = z.object({
  title: titleSchema,
  agenda: agendaSchema,
  date: dateSchema,
  time: timeSchema,
  duration: durationSchema,
  attendees: attendeesSchema,
  meetingLink: meetingLinkSchema,
});

export const updateEventSchema = z.object({
  title: titleSchema,
  agenda: agendaSchema,
  date: dateSchema,
  time: timeSchema,
  duration: durationSchema,
  attendees: attendeesSchema,
  meetingLink: meetingLinkSchema,
});