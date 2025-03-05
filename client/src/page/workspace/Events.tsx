import CreateMeetingDialog from "@/components/workspace/event/create-meeting-dialog";
import MeetingCalendar from "@/components/workspace/event/calendar";

export default function Events() {
  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Meetings</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of meetings for this workspace!
          </p>
        </div>
        <CreateMeetingDialog />
      </div>
      <div>
        <MeetingCalendar />
      </div>
    </div>
  );
}
