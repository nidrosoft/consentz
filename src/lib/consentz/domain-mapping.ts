export const DOMAIN_MAPPINGS: Record<string, string[]> = {
  'infection_control': ['safe'],
  'safeguarding': ['safe'],
  'risk_assessment': ['safe'],
  'medication_management': ['safe'],
  'incident_report': ['safe', 'well_led'],
  'fire_safety': ['safe'],
  'dbs_check': ['safe'],
  'emergency_procedures': ['safe'],
  'consent_form': ['effective'],
  'treatment_protocol': ['effective'],
  'staff_training': ['effective', 'safe'],
  'care_plan': ['effective', 'caring'],
  'gmc_registration': ['effective'],
  'competency_assessment': ['effective'],
  'patient_feedback': ['caring', 'responsive'],
  'dignity_policy': ['caring'],
  'privacy_policy': ['caring'],
  'communication_aids': ['caring'],
  'complaints_procedure': ['responsive'],
  'waiting_times': ['responsive'],
  'accessibility': ['responsive'],
  'end_of_life_care': ['responsive'],
  'governance_policy': ['well_led'],
  'meeting_minutes': ['well_led'],
  'audit_report': ['well_led', 'safe'],
  'improvement_plan': ['well_led'],
  'staff_survey': ['well_led'],
  'duty_of_candour': ['well_led', 'safe'],
  'business_continuity': ['well_led'],
};

export function suggestDomains(category: string, title: string): string[] {
  const key = category.toLowerCase().replace(/\s+/g, '_');
  if (DOMAIN_MAPPINGS[key]) return DOMAIN_MAPPINGS[key];

  const titleLower = title.toLowerCase();
  const suggestions: Set<string> = new Set();

  for (const [pattern, domains] of Object.entries(DOMAIN_MAPPINGS)) {
    const words = pattern.split('_');
    if (words.some(word => titleLower.includes(word))) {
      domains.forEach(d => suggestions.add(d));
    }
  }

  return suggestions.size > 0 ? Array.from(suggestions) : ['well_led'];
}
