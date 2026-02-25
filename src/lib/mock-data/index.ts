import type {
  Organization, AppUser, ComplianceScore, ComplianceGap, Task, Evidence,
  Policy, StaffMember, TrainingRecord, Incident, Notification,
  ActivityLogEntry, UpcomingDeadline,
} from '@/types';

export const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Brightwood Care Home',
  serviceType: 'CARE_HOME',
  postcode: 'SW1A 1AA',
  cqcProviderId: '1-123456789',
  cqcLocationId: '1-987654321',
  registeredManager: 'Jane Smith',
  bedCount: 35,
  currentRating: 'REQUIRES_IMPROVEMENT',
  lastInspection: '2025-06-15',
};

export const mockUser: AppUser = {
  id: 'user-1',
  name: 'Jane Smith',
  email: 'jane@brightwood.co.uk',
  role: 'ADMIN',
  avatar: null,
};

export const mockComplianceScore: ComplianceScore = {
  overall: 58,
  predictedRating: 'REQUIRES_IMPROVEMENT',
  lastUpdated: '2026-02-10T09:30:00Z',
  domains: [
    { domainId: 'safe', domainName: 'Safe', slug: 'safe', score: 72, rating: 'GOOD', gapCount: 2, trend: 5, kloeCount: 6 },
    { domainId: 'effective', domainName: 'Effective', slug: 'effective', score: 45, rating: 'REQUIRES_IMPROVEMENT', gapCount: 5, trend: -2, kloeCount: 7 },
    { domainId: 'caring', domainName: 'Caring', slug: 'caring', score: 68, rating: 'GOOD', gapCount: 1, trend: 3, kloeCount: 3 },
    { domainId: 'responsive', domainName: 'Responsive', slug: 'responsive', score: 51, rating: 'REQUIRES_IMPROVEMENT', gapCount: 3, trend: 0, kloeCount: 3 },
    { domainId: 'well-led', domainName: 'Well-Led', slug: 'well-led', score: 54, rating: 'REQUIRES_IMPROVEMENT', gapCount: 4, trend: -1, kloeCount: 6 },
  ],
};

export const mockGaps: ComplianceGap[] = [
  { id: 'gap-1', title: 'No safeguarding policy in place', description: 'Written safeguarding policy required and must be reviewed annually', severity: 'CRITICAL', status: 'OPEN', domain: 'safe', kloe: 'S1', regulation: 'Reg 13', createdAt: '2026-02-01' },
  { id: 'gap-2', title: 'DBS checks incomplete for 3 staff', description: 'All staff must have valid DBS checks', severity: 'CRITICAL', status: 'OPEN', domain: 'safe', kloe: 'S3', regulation: 'Reg 19', createdAt: '2026-02-01' },
  { id: 'gap-3', title: 'No complaints handling procedure', description: 'Written complaints procedure must be accessible to all', severity: 'CRITICAL', status: 'OPEN', domain: 'responsive', kloe: 'R2', regulation: 'Reg 16', createdAt: '2026-02-01' },
  { id: 'gap-4', title: 'Fire safety certificate expired', description: 'Fire safety risk assessment and certificate must be current', severity: 'HIGH', status: 'OPEN', domain: 'safe', kloe: 'S6', regulation: 'Reg 15', createdAt: '2026-02-01' },
  { id: 'gap-5', title: 'Staff training records incomplete', description: 'Mandatory training records not up to date', severity: 'HIGH', status: 'IN_PROGRESS', domain: 'effective', kloe: 'E5', regulation: 'Reg 18', createdAt: '2026-02-01' },
  { id: 'gap-6', title: 'No consent documentation process', description: 'Consent must be documented per Mental Capacity Act', severity: 'HIGH', status: 'OPEN', domain: 'effective', kloe: 'E7', regulation: 'Reg 11', createdAt: '2026-02-01' },
  { id: 'gap-7', title: 'Medicines management audit overdue', description: 'Regular medicines management audits required', severity: 'HIGH', status: 'OPEN', domain: 'safe', kloe: 'S4', regulation: 'Reg 12', createdAt: '2026-02-01' },
  { id: 'gap-8', title: 'No governance meeting schedule', description: 'Regular governance meetings required', severity: 'HIGH', status: 'OPEN', domain: 'well-led', kloe: 'W2', regulation: 'Reg 17', createdAt: '2026-02-01' },
  { id: 'gap-9', title: 'Care plans lack personalisation', description: 'Care plans must be person-centred', severity: 'MEDIUM', status: 'OPEN', domain: 'responsive', kloe: 'R1', regulation: 'Reg 9', createdAt: '2026-02-01' },
  { id: 'gap-10', title: 'Nutrition assessments not documented', description: 'Nutritional needs must be assessed and documented', severity: 'MEDIUM', status: 'OPEN', domain: 'effective', kloe: 'E3', regulation: 'Reg 14', createdAt: '2026-02-01' },
  { id: 'gap-11', title: 'No duty of candour records', description: 'Duty of candour must be documented', severity: 'MEDIUM', status: 'OPEN', domain: 'well-led', kloe: 'W6', regulation: 'Reg 20', createdAt: '2026-02-01' },
  { id: 'gap-12', title: 'Staff supervision records missing', description: 'Regular staff supervision required', severity: 'MEDIUM', status: 'IN_PROGRESS', domain: 'effective', kloe: 'E5', regulation: 'Reg 18', createdAt: '2026-02-01' },
  { id: 'gap-13', title: 'Service user feedback not collected', description: 'Regular engagement with service users', severity: 'LOW', status: 'OPEN', domain: 'well-led', kloe: 'W3', regulation: 'Reg 17', createdAt: '2026-02-01' },
  { id: 'gap-14', title: 'Vision statement not documented', description: 'Clear documented vision and strategy needed', severity: 'LOW', status: 'OPEN', domain: 'well-led', kloe: 'W1', regulation: 'Reg 17', createdAt: '2026-02-01' },
  { id: 'gap-15', title: 'End of life care policy needs update', description: 'End of life care policy should be current', severity: 'LOW', status: 'OPEN', domain: 'responsive', kloe: 'R3', regulation: 'Reg 9', createdAt: '2026-02-01' },
];

export const mockTasks: Task[] = [
  { id: 'task-1', title: 'Write safeguarding policy', description: 'Create comprehensive safeguarding adults policy', status: 'TODO', priority: 'URGENT', assignee: 'Jane Smith', dueDate: '2026-02-10', relatedGapId: 'gap-1', domain: 'safe' },
  { id: 'task-2', title: 'Complete DBS checks for all staff', description: 'Arrange DBS checks for 3 outstanding staff members', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Mark Jones', dueDate: '2026-02-13', relatedGapId: 'gap-2', domain: 'safe' },
  { id: 'task-3', title: 'Update infection control procedures', description: 'Review and update infection control policy', status: 'DONE', priority: 'HIGH', assignee: 'Sarah Williams', dueDate: '2026-02-08', relatedGapId: null, domain: 'safe' },
  { id: 'task-4', title: 'Review complaints procedure', description: 'Create formal complaints handling procedure', status: 'TODO', priority: 'MEDIUM', assignee: 'Jane Smith', dueDate: '2026-02-17', relatedGapId: 'gap-3', domain: 'responsive' },
  { id: 'task-5', title: 'Conduct fire drill', description: 'Organise and document fire evacuation drill', status: 'OVERDUE', priority: 'HIGH', assignee: 'Mark Jones', dueDate: '2026-02-08', relatedGapId: 'gap-4', domain: 'safe' },
  { id: 'task-6', title: 'Submit staff training records', description: 'Compile and submit all training documentation', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Emily Taylor', dueDate: '2026-02-24', relatedGapId: 'gap-5', domain: 'effective' },
  { id: 'task-7', title: 'Implement medicines audit', description: 'Set up regular medicines management audit schedule', status: 'TODO', priority: 'MEDIUM', assignee: 'Sarah Williams', dueDate: '2026-03-03', relatedGapId: 'gap-7', domain: 'safe' },
  { id: 'task-8', title: 'Create governance meeting schedule', description: 'Establish regular governance and quality meeting cadence', status: 'TODO', priority: 'LOW', assignee: 'Jane Smith', dueDate: '2026-03-12', relatedGapId: 'gap-8', domain: 'well-led' },
  { id: 'task-9', title: 'Update risk assessments', description: 'Review and update all current risk assessments', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'David Brown', dueDate: '2026-02-15', relatedGapId: null, domain: 'safe' },
  { id: 'task-10', title: 'Review incident reporting process', description: 'Improve incident reporting and lessons learned process', status: 'DONE', priority: 'MEDIUM', assignee: 'Jane Smith', dueDate: '2026-02-05', relatedGapId: null, domain: 'responsive' },
];

export const mockEvidence: Evidence[] = [
  { id: 'ev-1', name: 'Fire Safety Certificate', type: 'CERTIFICATE', fileName: 'fire-safety-cert-2025.pdf', fileSize: '2.4 MB', uploadedBy: 'Jane Smith', uploadedAt: '2025-12-15', expiresAt: '2026-02-17', linkedDomains: ['safe'], linkedKloes: ['S6'], status: 'EXPIRING_SOON' },
  { id: 'ev-2', name: 'Safeguarding Policy v3.1', type: 'POLICY', fileName: 'safeguarding-policy-v3.1.pdf', fileSize: '1.8 MB', uploadedBy: 'Jane Smith', uploadedAt: '2026-01-10', expiresAt: null, linkedDomains: ['safe'], linkedKloes: ['S1'], status: 'VALID' },
  { id: 'ev-3', name: 'Staff Training Log Q4', type: 'TRAINING_RECORD', fileName: 'training-log-q4-2025.xlsx', fileSize: '540 KB', uploadedBy: 'Emily Taylor', uploadedAt: '2026-01-05', expiresAt: null, linkedDomains: ['effective'], linkedKloes: ['E5'], status: 'VALID' },
  { id: 'ev-4', name: 'Infection Control Audit', type: 'AUDIT_REPORT', fileName: 'infection-control-audit-jan26.pdf', fileSize: '3.1 MB', uploadedBy: 'Sarah Williams', uploadedAt: '2026-01-20', expiresAt: null, linkedDomains: ['safe'], linkedKloes: ['S5'], status: 'VALID' },
  { id: 'ev-5', name: 'Risk Assessment - Falls', type: 'RISK_ASSESSMENT', fileName: 'risk-assessment-falls.pdf', fileSize: '890 KB', uploadedBy: 'Mark Jones', uploadedAt: '2025-11-20', expiresAt: '2026-03-12', linkedDomains: ['safe'], linkedKloes: ['S2'], status: 'VALID' },
  { id: 'ev-6', name: 'Complaints Procedure', type: 'POLICY', fileName: 'complaints-procedure-v1.pdf', fileSize: '420 KB', uploadedBy: 'Jane Smith', uploadedAt: '2024-06-15', expiresAt: '2025-06-15', linkedDomains: ['responsive'], linkedKloes: ['R2'], status: 'EXPIRED' },
  { id: 'ev-7', name: 'Board Meeting Minutes', type: 'MEETING_MINUTES', fileName: 'board-minutes-jan-2026.pdf', fileSize: '290 KB', uploadedBy: 'Jane Smith', uploadedAt: '2026-01-30', expiresAt: null, linkedDomains: ['well-led'], linkedKloes: ['W2'], status: 'VALID' },
  { id: 'ev-8', name: 'DBS Check Confirmation', type: 'CERTIFICATE', fileName: 'dbs-batch-confirmation.pdf', fileSize: '1.2 MB', uploadedBy: 'Emily Taylor', uploadedAt: '2026-02-05', expiresAt: null, linkedDomains: ['safe'], linkedKloes: ['S3'], status: 'VALID' },
];

export const mockPolicies: Policy[] = [
  { id: 'pol-1', title: 'Safeguarding Adults Policy', status: 'PUBLISHED', version: 'v3.1', category: 'Health & Safety', createdBy: 'Jane Smith', createdAt: '2025-03-01', updatedAt: '2026-01-10', lastReviewDate: '2026-01-10', nextReviewDate: '2027-01-10' },
  { id: 'pol-2', title: 'Infection Prevention & Control', status: 'PUBLISHED', version: 'v2.0', category: 'Clinical', createdBy: 'Sarah Williams', createdAt: '2025-06-15', updatedAt: '2025-12-20', lastReviewDate: '2025-12-20', nextReviewDate: '2026-12-20' },
  { id: 'pol-3', title: 'Complaints Handling Procedure', status: 'DRAFT', version: 'v1.0', category: 'Governance', createdBy: 'Jane Smith', createdAt: '2026-02-05', updatedAt: '2026-02-05', lastReviewDate: '', nextReviewDate: '' },
  { id: 'pol-4', title: 'Mental Capacity Act Policy', status: 'REVIEW', version: 'v1.2', category: 'Clinical', createdBy: 'Sarah Williams', createdAt: '2025-09-01', updatedAt: '2026-01-25', lastReviewDate: '2026-01-25', nextReviewDate: '2027-01-25' },
  { id: 'pol-5', title: 'Fire Safety Policy', status: 'APPROVED', version: 'v2.3', category: 'Health & Safety', createdBy: 'Mark Jones', createdAt: '2025-04-10', updatedAt: '2026-02-01', lastReviewDate: '2026-02-01', nextReviewDate: '2027-02-01' },
  { id: 'pol-6', title: 'Whistleblowing Policy', status: 'PUBLISHED', version: 'v1.1', category: 'Governance', createdBy: 'Jane Smith', createdAt: '2025-07-20', updatedAt: '2025-11-15', lastReviewDate: '2025-11-15', nextReviewDate: '2026-11-15' },
];

export const mockStaff: StaffMember[] = [
  { id: 'staff-1', name: 'Jane Smith', email: 'jane@brightwood.co.uk', role: 'Registered Manager', department: 'Management', startDate: '2020-03-01', dbsStatus: 'CLEAR', dbsExpiry: '2027-03-01', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: null, aestheticQualificationStatus: 'NOT_APPLICABLE', aestheticQualificationExpiry: null, staffType: 'ADMINISTRATIVE' },
  { id: 'staff-2', name: 'Mark Jones', email: 'mark@brightwood.co.uk', role: 'Senior Carer', department: 'Care', startDate: '2021-06-15', dbsStatus: 'CLEAR', dbsExpiry: '2026-02-24', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: null, aestheticQualificationStatus: 'NOT_APPLICABLE', aestheticQualificationExpiry: null, staffType: 'NON_MEDICAL' },
  { id: 'staff-3', name: 'Sarah Williams', email: 'sarah@brightwood.co.uk', role: 'Nurse', department: 'Clinical', startDate: '2022-01-10', dbsStatus: 'CLEAR', dbsExpiry: '2028-01-10', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: 'Level 7 Diploma in Aesthetic Medicine', aestheticQualificationStatus: 'VALID', aestheticQualificationExpiry: '2027-06-15', staffType: 'NON_MEDICAL' },
  { id: 'staff-4', name: 'David Brown', email: 'david@brightwood.co.uk', role: 'Care Assistant', department: 'Care', startDate: '2023-04-20', dbsStatus: 'CLEAR', dbsExpiry: '2028-04-20', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: null, aestheticQualificationStatus: 'NOT_APPLICABLE', aestheticQualificationExpiry: null, staffType: 'NON_MEDICAL' },
  { id: 'staff-5', name: 'Emily Taylor', email: 'emily@brightwood.co.uk', role: 'Admin Officer', department: 'Administration', startDate: '2023-09-01', dbsStatus: 'EXPIRED', dbsExpiry: '2025-09-01', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: null, aestheticQualificationStatus: 'NOT_APPLICABLE', aestheticQualificationExpiry: null, staffType: 'ADMINISTRATIVE' },
  // Clinic staff examples (aesthetic clinic credentials)
  { id: 'staff-6', name: 'Dr. Amara Osei', email: 'amara@brightwood.co.uk', role: 'Aesthetic Doctor', department: 'Clinical', startDate: '2024-01-15', dbsStatus: 'CLEAR', dbsExpiry: '2029-01-15', isActive: true, gmcNumber: '7654321', gmcStatus: 'VALID', gmcExpiry: '2027-12-31', aestheticQualification: 'Level 7 Diploma in Injectable Aesthetics', aestheticQualificationStatus: 'VALID', aestheticQualificationExpiry: '2028-03-20', staffType: 'MEDICAL' },
  { id: 'staff-7', name: 'Lucy Chen', email: 'lucy@brightwood.co.uk', role: 'Aesthetic Nurse Practitioner', department: 'Clinical', startDate: '2024-06-01', dbsStatus: 'CLEAR', dbsExpiry: '2029-06-01', isActive: true, gmcNumber: null, gmcStatus: 'NOT_APPLICABLE', gmcExpiry: null, aestheticQualification: 'Level 7 Certificate in Injectables & Dermal Fillers', aestheticQualificationStatus: 'EXPIRING_SOON', aestheticQualificationExpiry: '2026-04-10', staffType: 'NON_MEDICAL' },
];

export const mockIncidents: Incident[] = [
  { id: 'inc-1', title: 'Medication administration error', description: 'Wrong dosage of paracetamol administered to resident', severity: 'MAJOR', status: 'INVESTIGATING', reportedBy: 'Jane Smith', reportedAt: '2026-02-08T14:30:00Z', category: 'Clinical', incidentType: 'PREMISES', domain: 'safe' },
  { id: 'inc-2', title: 'Slip in wet corridor', description: 'Resident slipped in corridor after floor cleaning', severity: 'MINOR', status: 'RESOLVED', reportedBy: 'Mark Jones', reportedAt: '2026-02-05T10:15:00Z', category: 'Health & Safety', incidentType: 'PREMISES', domain: 'safe' },
  { id: 'inc-3', title: 'Aggressive visitor altercation', description: 'Verbal altercation between visitor and staff member', severity: 'MAJOR', status: 'REPORTED', reportedBy: 'Sarah Williams', reportedAt: '2026-02-09T16:45:00Z', category: 'Safeguarding', incidentType: 'PREMISES', domain: 'safe' },
  { id: 'inc-4', title: 'Near miss - wrong resident medication', description: 'Medication prepared for wrong resident but caught before administration', severity: 'NEAR_MISS', status: 'CLOSED', reportedBy: 'David Brown', reportedAt: '2026-01-28T08:20:00Z', category: 'Clinical', incidentType: 'PREMISES', domain: 'safe' },
  // Patient complication examples (aesthetic clinic)
  { id: 'inc-5', title: 'Adverse reaction to dermal filler', description: 'Patient experienced swelling and bruising beyond expected levels following lip filler procedure', severity: 'MAJOR', status: 'INVESTIGATING', reportedBy: 'Dr. Amara Osei', reportedAt: '2026-02-12T11:00:00Z', category: 'Complication', incidentType: 'PATIENT_COMPLICATION', domain: 'safe' },
  { id: 'inc-6', title: 'Post-Botox drooping eyelid', description: 'Patient reported ptosis (eyelid drooping) 3 days after botulinum toxin injection to forehead', severity: 'MINOR', status: 'REPORTED', reportedBy: 'Lucy Chen', reportedAt: '2026-02-14T09:30:00Z', category: 'Complication', incidentType: 'PATIENT_COMPLICATION', domain: 'safe' },
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', title: 'Document expiring', message: 'Fire safety certificate expires in 7 days', type: 'WARNING', isRead: false, createdAt: '2026-02-10T08:00:00Z', actionUrl: '/evidence/ev-1' },
  { id: 'notif-2', title: 'Task overdue', message: 'Review infection control policy — overdue by 2 days', type: 'ERROR', isRead: false, createdAt: '2026-02-10T05:00:00Z', actionUrl: '/tasks' },
  { id: 'notif-3', title: 'Score changed', message: 'Compliance score updated: 55% → 58% (+3)', type: 'SUCCESS', isRead: false, createdAt: '2026-02-09T18:00:00Z', actionUrl: '/' },
  { id: 'notif-4', title: 'New policy created', message: 'Complaints Handling Procedure draft created', type: 'INFO', isRead: true, createdAt: '2026-02-05T10:00:00Z', actionUrl: '/policies/pol-3' },
  { id: 'notif-5', title: 'Staff training completed', message: 'Sarah Williams completed Fire Safety training', type: 'SUCCESS', isRead: true, createdAt: '2026-02-03T14:30:00Z', actionUrl: '/staff/staff-3' },
  { id: 'notif-6', title: 'Incident reported', message: 'New incident: Medication administration error', type: 'WARNING', isRead: true, createdAt: '2026-02-08T15:00:00Z', actionUrl: '/incidents/inc-1' },
];

export const mockActivityLog: ActivityLogEntry[] = [
  { id: 'log-1', action: 'EVIDENCE_UPLOADED', description: 'Uploaded evidence: Fire Safety Certificate', user: 'Jane Smith', createdAt: '2026-02-10T08:30:00Z', entityType: 'EVIDENCE' },
  { id: 'log-2', action: 'SCORE_RECALCULATED', description: 'Compliance score recalculated: 55% → 58%', user: 'System', createdAt: '2026-02-09T18:00:00Z', entityType: 'ORGANIZATION' },
  { id: 'log-3', action: 'TASK_COMPLETED', description: 'Completed task: Update infection control procedures', user: 'Sarah Williams', createdAt: '2026-02-08T16:30:00Z', entityType: 'TASK' },
  { id: 'log-4', action: 'POLICY_CREATED', description: 'Created policy: Complaints Handling Procedure', user: 'Jane Smith', createdAt: '2026-02-05T10:00:00Z', entityType: 'POLICY' },
  { id: 'log-5', action: 'INCIDENT_REPORTED', description: 'Reported incident: Medication administration error', user: 'Jane Smith', createdAt: '2026-02-08T14:30:00Z', entityType: 'INCIDENT' },
  { id: 'log-6', action: 'STAFF_UPDATED', description: 'Updated staff record: DBS check renewed for David Brown', user: 'Emily Taylor', createdAt: '2026-02-07T11:00:00Z', entityType: 'STAFF' },
  { id: 'log-7', action: 'TRAINING_COMPLETED', description: 'Training completed: Fire Safety — Sarah Williams', user: 'Sarah Williams', createdAt: '2026-02-03T14:30:00Z', entityType: 'TRAINING' },
  { id: 'log-8', action: 'GAP_STATUS_CHANGED', description: 'Gap status changed: Staff training records incomplete → In Progress', user: 'Emily Taylor', createdAt: '2026-02-02T09:00:00Z', entityType: 'GAP' },
  { id: 'log-9', action: 'EVIDENCE_UPLOADED', description: 'Uploaded evidence: Infection Control Audit', user: 'Sarah Williams', createdAt: '2026-01-20T14:00:00Z', entityType: 'EVIDENCE' },
  { id: 'log-10', action: 'TASK_CREATED', description: 'Auto-created task: Write safeguarding policy (from gap)', user: 'System', createdAt: '2026-02-01T00:00:00Z', entityType: 'TASK' },
];

export const mockDeadlines: UpcomingDeadline[] = [
  { id: 'dl-1', title: 'Safeguarding policy review', dueDate: '2026-02-10', type: 'POLICY_REVIEW', severity: 'CRITICAL', relatedEntityId: 'pol-1' },
  { id: 'dl-2', title: 'Mark Jones — DBS renewal due', dueDate: '2026-02-24', type: 'DBS_RENEWAL', severity: 'HIGH', relatedEntityId: 'staff-2' },
  { id: 'dl-3', title: 'Fire safety certificate renewal', dueDate: '2026-02-17', type: 'EVIDENCE_EXPIRY', severity: 'HIGH', relatedEntityId: 'ev-1' },
  { id: 'dl-4', title: 'DBS update check — Emily Taylor', dueDate: '2026-03-01', type: 'DBS_RENEWAL', severity: 'MEDIUM', relatedEntityId: 'staff-5' },
  { id: 'dl-5', title: 'Annual infection control audit due', dueDate: '2026-03-12', type: 'EVIDENCE_EXPIRY', severity: 'LOW', relatedEntityId: 'ev-4' },
];
