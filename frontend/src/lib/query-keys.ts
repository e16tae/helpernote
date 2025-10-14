// Centralized query keys for React Query
export const queryKeys = {
  // Customers
  customers: {
    all: ['customers'] as const,
    detail: (id: number) => ['customers', id] as const,
  },

  // Job Postings
  jobPostings: {
    all: ['job-postings'] as const,
    detail: (id: number) => ['job-postings', id] as const,
  },

  // Job Seeking
  jobSeekings: {
    all: ['job-seekings'] as const,
    detail: (id: number) => ['job-seekings', id] as const,
  },

  // Matchings
  matchings: {
    all: ['matchings'] as const,
    detail: (id: number) => ['matchings', id] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },

  // Tags
  tags: {
    all: ['tags'] as const,
  },
} as const;
