export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    allDay: boolean;
    status: string;
    htmlLink: string;
    organizer: {
        email: string;
        name: string | null;
    } | null;
    attendees: {
        email: string;
        name: string | null;
        responseStatus: string;
    }[] | null;
    conferenceLink: string | null;
}

export interface CalendarStatus {
    connected: boolean;
    email?: string;
}

export interface EventMinuteLink {
    id: string;
    googleEventId: string;
    minuteId: string;
    employeeId: string;
    createdAt: string;
}
