import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { resolveSessionAuth } from '@/lib/auth';
import { SYSTEM_PROMPT } from '@/lib/ai/chat-system-prompt';

export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  let session;
  try {
    session = await resolveSessionAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!checkRateLimit(session.userId)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const supabase = getDb();

  let orgContext = '';

  if (supabase && session.organizationId) {
    const [orgResult, scoresResult, gapsResult, tasksResult, syncResult] =
      await Promise.all([
        supabase
          .from('organizations')
          .select('name, service_type, cqc_registration_number')
          .eq('id', session.organizationId)
          .single(),
        supabase
          .from('compliance_scores')
          .select('score, predicted_rating, calculated_at')
          .eq('organization_id', session.organizationId)
          .maybeSingle(),
        supabase
          .from('compliance_gaps')
          .select('title, domain, severity, status')
          .eq('organization_id', session.organizationId)
          .eq('status', 'OPEN')
          .order('severity')
          .limit(10),
        supabase
          .from('tasks')
          .select('title, status, priority, domain, due_date')
          .eq('organization_id', session.organizationId)
          .neq('status', 'DONE')
          .order('due_date')
          .limit(10),
        supabase
          .from('consentz_sync_logs')
          .select('synced_at')
          .eq('organization_id', session.organizationId)
          .eq('status', 'success')
          .order('synced_at', { ascending: false })
          .limit(1),
      ]);

    const org = orgResult.data;
    const scores = scoresResult.data;
    const gaps = gapsResult.data;
    const tasks = tasksResult.data;
    const lastSync = syncResult.data?.[0];

    orgContext = `

LIVE USER CONTEXT (use this to personalize responses):
- User Name: ${session.fullName || 'Unknown'}
- User Role: ${session.role || 'Unknown'}
- Organization: ${org?.name || 'Unknown'}
- Service Type: ${org?.service_type === 'CARE_HOME' ? 'Care Home (Residential Adult Social Care)' : 'Aesthetic Clinic (Independent Healthcare)'}
- CQC Registration: ${org?.cqc_registration_number || 'Not set'}
- Current Compliance Score: ${scores ? `${Math.round(scores.score)}%` : 'Not yet calculated'}
- Predicted CQC Rating: ${scores?.predicted_rating || 'Not yet calculated'}
- Last Data Sync: ${lastSync?.synced_at || 'Never'}
- Open Compliance Gaps (top 10): ${gaps?.map((g) => `${g.title} [${g.domain}/${g.severity}]`).join('; ') || 'None'}
- Active Tasks (top 10): ${tasks?.map((t) => `${t.title} [${t.priority}/${t.status}, due: ${t.due_date || 'no date'}]`).join('; ') || 'None'}
`;
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: SYSTEM_PROMPT + orgContext,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 2000,
  });

  return result.toUIMessageStreamResponse();
}
