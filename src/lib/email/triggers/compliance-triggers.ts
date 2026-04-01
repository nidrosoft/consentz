import { sendEmail } from '../send';
import { scoreMilestoneEmail } from '../templates/score-milestone';
import { scoreDroppedEmail } from '../templates/score-dropped';
import { firstGoodEmail } from '../templates/first-good';
import { getDb } from '@/lib/db';

function getRating(score: number): string {
  if (score >= 88) return 'OUTSTANDING';
  if (score >= 63) return 'GOOD';
  if (score >= 40) return 'REQUIRES_IMPROVEMENT';
  return 'INADEQUATE';
}

export async function checkScoreChanges(organizationId: string, newScore: number, previousScore: number) {
  const db = await getDb();

  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', organizationId)
    .in('role', ['OWNER', 'ADMIN']);

  if (!admins?.length) return;

  const newRating = getRating(newScore);
  const previousRating = getRating(previousScore);

  // Rating milestone — crossed a rating boundary upward
  if (newRating !== previousRating && newScore > previousScore) {
    for (const admin of admins) {
      await sendEmail(
        {
          to: admin.email,
          subject: '🎉 Your CQC Rating Prediction Just Improved!',
          html: scoreMilestoneEmail({ userName: admin.name || 'there', previousRating, newRating, overallScore: newScore, previousScore }),
        },
        { organizationId, userId: admin.id, emailType: 'score_milestone' },
      );
    }
  }

  // Score dropped significantly (10+ points)
  const drop = previousScore - newScore;
  if (drop >= 10) {
    for (const admin of admins) {
      await sendEmail(
        {
          to: admin.email,
          subject: '⚠️ Your Compliance Score Has Dropped — Action Needed',
          html: scoreDroppedEmail({ userName: admin.name || 'there', previousScore, newScore, dropAmount: drop, predictedRating: newRating, likelyCauses: [] }),
        },
        { organizationId, userId: admin.id, emailType: 'score_dropped' },
      );
    }
  }

  // First time hitting GOOD
  if (newRating === 'GOOD' && previousRating !== 'GOOD' && previousRating !== 'OUTSTANDING') {
    const { data: org } = await db.from('organizations').select('created_at').eq('id', organizationId).single();
    const daysToGetHere = org?.created_at
      ? Math.floor((Date.now() - new Date(org.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    for (const admin of admins) {
      await sendEmail(
        {
          to: admin.email,
          subject: '🏆 Your CQC Prediction Just Hit "Good"!',
          html: firstGoodEmail({ userName: admin.name || 'there', overallScore: newScore, daysToGetHere }),
        },
        { organizationId, userId: admin.id, emailType: 'first_good' },
      );
    }
  }
}
