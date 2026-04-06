const CAL_API_URL = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-06-14";

function getHeaders() {
    const key = process.env.CAL_API_KEY;
    if (!key) throw new Error("CAL_API_KEY is not configured");
    return {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "cal-api-version": CAL_API_VERSION,
    };
}

export interface CalCalendar {
    credentialId: number;
    integration: string;
    integrationTitle: string;
    primary: boolean;
    externalId: string;
    name: string;
    readOnly: boolean;
}

export interface CalConnectedCalendars {
    connectedCalendars: {
        integration: { type: string; title: string };
        credentialId: number;
        calendars: CalCalendar[];
    }[];
    destinationCalendar: CalCalendar | null;
}

export interface CalEventType {
    id: number;
    title: string;
    slug: string;
    lengthInMinutes: number;
    description: string | null;
}

export class CalendarService {
    static async getConnectedCalendars(): Promise<CalConnectedCalendars> {
        const res = await fetch(`${CAL_API_URL}/calendars`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Cal.com API error ${res.status}: ${text}`);
        }
        const json = await res.json();
        return json.data ?? json;
    }

    static async getEventTypes(): Promise<CalEventType[]> {
        const res = await fetch(`${CAL_API_URL}/event-types`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Cal.com API error ${res.status}: ${text}`);
        }
        const json = await res.json();
        return json.data?.eventTypeGroups?.flatMap((g: { eventTypes: CalEventType[] }) => g.eventTypes) ?? json.data ?? [];
    }

    static async createBooking(params: {
        eventTypeId: number;
        start: string;
        attendee: { name: string; email: string; timeZone: string };
        metadata?: Record<string, string>;
    }) {
        const res = await fetch(`${CAL_API_URL}/bookings`, {
            method: "POST",
            headers: {
                ...getHeaders(),
                "cal-api-version": "2024-08-13",
            },
            body: JSON.stringify({
                start: params.start,
                eventTypeId: params.eventTypeId,
                attendee: params.attendee,
                metadata: params.metadata,
            }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Cal.com booking error ${res.status}: ${text}`);
        }
        return res.json();
    }

    static async createEventType(params: {
        title: string;
        slug: string;
        lengthInMinutes: number;
        description?: string;
    }): Promise<CalEventType> {
        const res = await fetch(`${CAL_API_URL}/event-types`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(params),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Cal.com create event type error ${res.status}: ${text}`);
        }
        const json = await res.json();
        return json.data;
    }

    static async syncTaskToCalendar(task: {
        id: string;
        title: string;
        dueDate: string;
        assigneeEmail?: string;
        assigneeName?: string;
    }) {
        const eventTypes = await this.getEventTypes();

        let taskEventType = eventTypes.find((et) => et.slug === "cqc-compliance-task");
        if (!taskEventType) {
            taskEventType = await this.createEventType({
                title: "CQC Compliance Task",
                slug: "cqc-compliance-task",
                lengthInMinutes: 60,
                description: "Auto-synced compliance task from Consentz",
            });
        }

        const startDate = new Date(task.dueDate);
        startDate.setUTCHours(9, 0, 0, 0);

        return this.createBooking({
            eventTypeId: taskEventType.id,
            start: startDate.toISOString(),
            attendee: {
                name: task.assigneeName ?? "Compliance Team",
                email: task.assigneeEmail ?? "compliance@consentz.com",
                timeZone: "Europe/London",
            },
            metadata: {
                consentzTaskId: task.id,
                source: "consentz-cqc",
            },
        });
    }

    static isConfigured(): boolean {
        return !!process.env.CAL_API_KEY;
    }
}
