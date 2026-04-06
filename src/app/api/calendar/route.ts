import { z } from 'zod';
import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { CalendarService } from '@/lib/services/calendar-service';

const calendarSyncSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(500),
  dueDate: z.string().datetime(),
  assigneeName: z.string().max(200).optional(),
  assigneeEmail: z.string().email().optional(),
});

export const GET = withAuth(async (_req, { auth }) => {
  if (!CalendarService.isConfigured()) {
    return apiSuccess({ connected: false, calendars: [], configured: false });
  }

  try {
    const data = await CalendarService.getConnectedCalendars();
    const allCalendars = data.connectedCalendars.flatMap((cc) =>
      cc.calendars.map((c) => ({
        id: c.externalId,
        name: c.name,
        provider: cc.integration.title,
        providerType: cc.integration.type,
        primary: c.primary,
        readOnly: c.readOnly,
        credentialId: cc.credentialId,
      })),
    );

    return apiSuccess({
      connected: allCalendars.length > 0,
      configured: true,
      calendars: allCalendars,
      destination: data.destinationCalendar
        ? { id: data.destinationCalendar.externalId, name: data.destinationCalendar.name }
        : null,
    });
  } catch (err) {
    console.error('[Calendar] Failed to fetch calendars:', err);
    return apiSuccess({ connected: false, calendars: [], configured: true, error: 'Failed to reach Cal.com' });
  }
});

export const POST = withAuth(async (req, { auth }) => {
  if (!CalendarService.isConfigured()) {
    return ApiErrors.badRequest('Calendar integration is not configured. Add your Cal.com API key in settings.');
  }

  const body = await req.json();
  const validated = calendarSyncSchema.parse(body);
  const { taskId, title, dueDate, assigneeName, assigneeEmail } = validated;

  try {
    const result = await CalendarService.syncTaskToCalendar({
      id: taskId,
      title,
      dueDate,
      assigneeName,
      assigneeEmail,
    });

    return apiSuccess({ synced: true, booking: result });
  } catch (err) {
    console.error('[Calendar] Sync failed:', err);
    return ApiErrors.internal('Failed to sync task to calendar. Please try again.');
  }
});
