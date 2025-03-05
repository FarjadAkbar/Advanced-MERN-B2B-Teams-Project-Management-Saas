import mongoose, { Document, Schema, Types } from "mongoose";

export interface EventDocument extends Document {
  title: string;
  agenda?: string;
  date: string;
  time: string;
  duration: string;
  attendees: Types.ObjectId[];
  meetingLink: string;
  createdBy: Types.ObjectId;
  workspace: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<EventDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: String,
      trim: true,
      default: undefined,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    meetingLink: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EventModel = mongoose.model<EventDocument>("Event", eventSchema);

export default EventModel;