/**
 * Upserts the full canonical question bank from `assessment-questions.ts` into
 * `assessment_questions` with deterministic IDs (see `stableAssessmentQuestionUuid`).
 *
 * Run after migrations: `npx tsx scripts/seed-full-assessment-bank.ts`
 */
import { createClient } from "@supabase/supabase-js";

import {
  ASSESSMENT_QUESTIONS,
  type AnswerType,
} from "../src/lib/constants/assessment-questions";
import { stableAssessmentQuestionUuid } from "../src/lib/assessment-question-stable-id";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type QuestionType = "YES_NO" | "SCALE" | "MULTIPLE_CHOICE" | "TEXT";

function mapAnswerTypeToQuestionType(at: AnswerType): QuestionType {
  switch (at) {
    case "yes_no":
    case "yes_no_partial":
      return "YES_NO";
    case "scale":
      return "SCALE";
    case "multi_select":
      return "MULTIPLE_CHOICE";
    case "text":
    case "date":
    case "number":
      return "TEXT";
    default:
      return "YES_NO";
  }
}

function extractSortOrderFromQuestionId(id: string): number {
  const m = /_Q(\d+)$/.exec(id);
  return m ? Number.parseInt(m[1]!, 10) : 0;
}

async function main() {
  let count = 0;
  for (const q of ASSESSMENT_QUESTIONS) {
    const { data: kloe } = await supabase
      .from("kloes")
      .select("id")
      .eq("code", q.kloeCode)
      .maybeSingle();

    if (!kloe) {
      console.warn(`Skipping ${q.id}: missing KLOE ${q.kloeCode}`);
      continue;
    }
    for (const st of q.serviceTypes) {
      const id = stableAssessmentQuestionUuid(q.id, st);
      const row = {
        id,
        kloe_id: kloe.id,
        service_type: st,
        question: q.text,
        help_text: q.helpText ?? null,
        question_type: mapAnswerTypeToQuestionType(q.answerType),
        weight: q.weight,
        sort_order: extractSortOrderFromQuestionId(q.id),
      };

      const { error } = await supabase
        .from("assessment_questions")
        .upsert(row, { onConflict: "id" });

      if (error) {
        console.error(`Error upserting ${q.id} / ${st}:`, error.message);
      } else {
        count++;
      }
    }
  }
  console.log(`Seeded ${count} assessment question rows (full bank).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
