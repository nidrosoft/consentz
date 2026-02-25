export const ROUTES = {
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
  },
  onboarding: {
    welcome: '/welcome',
    assessment: (step: number) => `/assessment/${step}`,
    results: '/assessment/results',
  },
  dashboard: {
    home: '/',
    domains: {
      index: '/domains',
      detail: (slug: string) => `/domains/${slug}`,
      kloe: (slug: string, kloe: string) => `/domains/${slug}/${kloe}`,
    },
    evidence: {
      index: '/evidence',
      upload: '/evidence/upload',
      detail: (id: string) => `/evidence/${id}`,
    },
    policies: {
      index: '/policies',
      create: '/policies/create',
      templates: '/policies/templates',
      detail: (id: string) => `/policies/${id}`,
    },
    staff: {
      index: '/staff',
      add: '/staff/add',
      detail: (id: string) => `/staff/${id}`,
      training: '/staff/training',
    },
    incidents: {
      index: '/incidents',
      report: '/incidents/report',
      detail: (id: string) => `/incidents/${id}`,
    },
    tasks: '/tasks',
    audits: '/audits',
    notifications: '/notifications',
    reports: {
      index: '/reports',
      compliance: '/reports/compliance',
      inspectionPrep: '/reports/inspection-prep',
      export: '/reports/export',
    },
    settings: {
      index: '/settings',
      organization: '/settings/organization',
      users: '/settings/users',
      billing: '/settings/billing',
      integrations: '/settings/integrations',
      notifications: '/settings/notifications',
    },
  },
} as const;
