"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Video, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Link } from "react-router-dom";
import type { EventType } from "@/types/api.type"
import { getAllEventsQueryFn, deleteEventMutationFn } from "@/lib/api"
import useEventFilter from "@/hooks/use-event-filter"
import useWorkspaceId from "@/hooks/use-workspace-id"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/resuable/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMinutes, parseISO, setHours, setMinutes } from "date-fns";

const calculateMeetingTimes = (event: EventType) => {
  try {
    // Parse the base date from ISO string
    const baseDate = parseISO(event.date);

    // Extract hours and minutes from event.time
    const [hours, minutes] = event.time.split(":").map(Number);

    // Set the extracted time to the date
    const startDateTime = setMinutes(setHours(baseDate, hours), minutes);

    // Calculate end time by adding duration
    const endDateTime = addMinutes(startDateTime, Number(event.duration));

    // Format outputs
    return {
      start: `${format(startDateTime, "MMM, dd yyyy")} - ${event.duration} minutes`, // May, 26 2025 - 45 minutes
      end: `${format(startDateTime, "h:mm a")} - ${format(endDateTime, "h:mm a")}`, // 11:30 AM - 12:00 PM
    };
  } catch (error) {
    console.error("Error parsing date/time:", error);
    return { start: event.date, end: "Invalid time" };
  }
};


export default function GoogleCalendarView() {
  const calendarRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(100) // Fetch more events for the calendar view
  const [openDeleteDialog, setOpenDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)

  const [filters, setFilters] = useEventFilter()
  const workspaceId = useWorkspaceId()

  // Update filters when week changes
  useEffect(() => {
    setFilters({
      ...filters,
    })
  }, [setFilters, filters])

  const { data, isLoading } = useQuery({
    queryKey: ["all-events", workspaceId, pageSize, pageNumber, filters],
    queryFn: () =>
      getAllEventsQueryFn({
        workspaceId,
        keyword: filters.keyword,
        date: filters.date,
        attendees: filters.attendees,
        pageNumber,
        pageSize,
      }),
    staleTime: 0,
  })

  const events: EventType[] = data?.events || []
  const totalCount = data?.pagination?.totalCount || 0

  // Calculate pagination values
  const pageCount = Math.ceil(totalCount / pageSize)
  const pageIndex = pageNumber - 1


  const { mutate, isPending } = useMutation({
    mutationFn: deleteEventMutationFn,
  })

  const handleConfirm = () => {
    if (!selectedEvent) return

    mutate(
      {
        workspaceId,
        eventId: selectedEvent._id,
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({
            queryKey: ["all-events", workspaceId],
          })
          toast({
            title: "Success",
            description: data.message,
            variant: "success",
          })
          setTimeout(() => setOpenDialog(false), 100)
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        },
      },
    )
  }

  const handlePageChange = (page: number) => {
    setPageNumber(page + 1)
  }

  // Handle page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPageNumber(1) // Reset to first page when changing page size
  }

  const openCancelDialog = (event: EventType) => {
    setSelectedEvent(event)
    setOpenDialog(true)
  }

  return (
    <div className="flex flex-col h-full" ref={calendarRef}>
      {events.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        events.map((event: EventType) => (
          <div key={event._id}>
            <div>
              <div className="grid grid-cols-5 justify-between items-center">
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm">{calculateMeetingTimes(event).start}</p>
                  <p className="text-muted-foreground text-xs pt-1">
                    {calculateMeetingTimes(event).end}
                  </p>
                  <div className="flex items-center mt-1">
                    <Video className="size-4 mr-2 text-primary" />
                    <Link
                      className="text-xs text-primary underline underline-offset-4"
                      target="_blank"
                      to={event.meetingLink}
                      rel="noopener noreferrer"
                    >
                      Join Meeting
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <h2 className="text-sm font-medium">{event.title}</h2>
                  <p className="text-sm text-muted-foreground">You and {event.attendees.length}</p>
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button type="button" asChild className="cursor-pointer">
                    <Link to={`/event/${event._id}`}>Edit</Link>
                  </Button>
                  <Button variant="destructive" className="cursor-pointer" onClick={() => openCancelDialog(event)}>
                    Cancel
                  </Button>
                </div>
              </div>
              <Separator className="my-3" />
            </div>
          </div>
        ))
      )}

      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2 mt-4">
          {/* Showing X to Y of Z Rows */}
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-x-8 lg:space-y-0">
            {/* Rows Per Page Selector */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select value={`${pageSize}`} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Info */}
            <div className="flex items-center">
              <div className="flex lg:w-[100px] items-center justify-center text-sm font-medium">
                Page {pageIndex + 1} of {pageCount || 1}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(0)}
                  disabled={pageIndex === 0 || isLoading}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => handlePageChange(pageIndex - 1)}
                  disabled={pageIndex === 0 || isLoading}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => handlePageChange(pageIndex + 1)}
                  disabled={pageIndex >= pageCount - 1 || isLoading}
                >
                  <span className="sr-only">Go to next page</span>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(pageCount - 1)}
                  disabled={pageIndex >= pageCount - 1 || isLoading}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {selectedEvent && (
        <ConfirmDialog
          isOpen={openDeleteDialog}
          isLoading={isPending}
          onClose={() => setOpenDialog(false)}
          onConfirm={handleConfirm}
          title="Cancel Event"
          description={`Are you sure you want to cancel "${selectedEvent.title}"?`}
          confirmText="Cancel Event"
          cancelText="Keep Event"
        />
      )}
    </div>
  )
}

