"use client"

import { z } from "zod"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CalendarIcon, Clock, Link, Loader, Plus, X } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper"
import useWorkspaceId from "@/hooks/use-workspace-id"
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { createEventMutationFn } from "@/lib/api"

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
]

// Time slots from 9 AM to 6 PM
const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor((i + 18) / 2) % 12 || 12
  const minute = (i + 18) % 2 === 0 ? "00" : "30"
  const ampm = Math.floor((i + 18) / 2) < 12 ? "AM" : "PM"
  return {
    value: `${Math.floor((i + 18) / 2)}:${minute}`,
    label: `${hour}:${minute} ${ampm}`,
  }
})

export default function ScheduleMeetingForm(props: {
  onClose: () => void
}) {
  const { onClose } = props

  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceId()

  const { mutate, isPending } = useMutation({
    mutationFn: createEventMutationFn,
  })

  const { data: memberData } = useGetWorkspaceMembers(workspaceId)
  const members = memberData?.members || []

  const formSchema = z.object({
    title: z.string().trim().min(1, {
      message: "Title is required",
    }),
    agenda: z.string().trim().optional(),
    date: z.string().trim().min(1, ({
      message: "A date is required.",
    })),
    time: z.string({
      required_error: "Meeting time is required",
    }),
    duration: z.string({
      required_error: "Duration is required",
    }),
    attendees: z.array(z.string()).min(1, {
      message: "At least one attendee is required",
    }),
    meetingLink: z.string().url(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      agenda: "",
      attendees: [],
    },
  })

  const selectedAttendees = form.watch("attendees")

  const onSubmit = (values: FormValues) => {
    if (isPending) return


    const payload = {
      workspaceId,
      data: {
        ...values,
        // date: meetingDate.toISOString(),
      },
    }

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["meetings", workspaceId],
        })

        toast({
          title: "Success",
          description: "Meeting scheduled successfully",
          variant: "success",
        })
        onClose()
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to schedule meeting",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Schedule Meeting
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">Create a meeting and invite team members</p>
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Meeting Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">Meeting title</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekly Team Sync" className="h-[48px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meeting Agenda */}
            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    Agenda
                    <span className="text-xs font-extralight ml-2">Optional</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Discuss project progress, blockers, and next steps" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">Meeting title</FormLabel>
                  <FormControl>
                    <Input placeholder="Select date" type="date" className="h-[48px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


              {/* Time Selection */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                          <Clock className="h-4 w-4 opacity-50" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_OPTIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attendees */}
            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Attendees</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between", !field.value.length && "text-muted-foreground")}
                        >
                          {field.value.length > 0
                            ? `${field.value.length} attendee${field.value.length > 1 ? "s" : ""} selected`
                            : "Select attendees"}
                          <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No members found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {members.map((member) => {
                                const userId = member.userId?._id
                                const name = member.userId?.name || "Unknown"
                                const initials = getAvatarFallbackText(name)
                                const avatarColor = getAvatarColor(name)
                                const isSelected = selectedAttendees.includes(userId)

                                return (
                                  <CommandItem
                                    key={userId}
                                    onSelect={() => {
                                      const newAttendees = isSelected
                                        ? selectedAttendees.filter((id) => id !== userId)
                                        : [...selectedAttendees, userId]
                                      form.setValue("attendees", newAttendees)
                                    }}
                                    className="flex items-center gap-2 px-2 py-1"
                                  >
                                    <div className="flex items-center flex-1 gap-2">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => {
                                          const newAttendees = isSelected
                                            ? selectedAttendees.filter((id) => id !== userId)
                                            : [...selectedAttendees, userId]
                                          form.setValue("attendees", newAttendees)
                                        }}
                                      />
                                      <Avatar className="h-7 w-7">
                                        <AvatarImage src={member.userId?.profilePicture || ""} alt={name} />
                                        <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                                      </Avatar>
                                      <span>{name}</span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Display selected attendees */}
                  {selectedAttendees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAttendees.map((attendeeId) => {
                        const member = members.find((m) => m.userId?._id === attendeeId)
                        if (!member) return null

                        const name = member.userId?.name || "Unknown"
                        const initials = getAvatarFallbackText(name)
                        const avatarColor = getAvatarColor(name)

                        return (
                          <Badge
                            key={attendeeId}
                            variant="secondary"
                            className="flex items-center gap-1 py-1 pl-1 pr-2"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.userId?.profilePicture || ""} alt={name} />
                              <AvatarFallback className={avatarColor} style={{ fontSize: "10px" }}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{name}</span>
                            <X
                              className="h-3 w-3 cursor-pointer ml-1"
                              onClick={() => {
                                form.setValue(
                                  "attendees",
                                  selectedAttendees.filter((id) => id !== attendeeId),
                                )
                              }}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meeting Link */}
              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Link className="h-4 w-4" />
                      Meeting Link
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://meet.google.com/abc-defg-hij" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="h-[40px] text-white font-semibold" disabled={isPending}>
                {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Meeting
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

