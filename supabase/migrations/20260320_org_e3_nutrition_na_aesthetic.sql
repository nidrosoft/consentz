-- Aesthetic clinics: when true, E3 (nutrition) is marked N/A and excluded from evidence completion scoring.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS e3_nutrition_na_aesthetic BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN organizations.e3_nutrition_na_aesthetic IS
  'Aesthetic clinic only: E3 nutrition KLOE not applicable; excluded from kloe_evidence_status scoring counts.';
