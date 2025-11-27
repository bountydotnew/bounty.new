import { z } from 'zod';

// =====================
// BOUNTY FORMS
// =====================

export const createBountySchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(50_000, 'Description too long'),

  amount: z
    .string()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.')
    .min(1, 'Amount cannot be empty')
    .max(10_000_000_000, 'Amount cannot be greater than 100,000'),
  currency: z.string().min(1, 'Currency cannot be empty'),
  difficulty: z
    .string()
    .refine((val) => val !== '' && ['beginner', 'intermediate', 'advanced', 'expert'].includes(val), {
      message: 'Please select a difficulty',
    }),
  deadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  issueUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateBountyForm = z.infer<typeof createBountySchema>;

export const createBountyDefaults: CreateBountyForm = {
  title: '',
  description: '',
  amount: '',
  currency: 'USD',
  difficulty: '',
  deadline: '',
  tags: [],
  repositoryUrl: '',
  issueUrl: '',
};

// Draft templates for bounty creation
//export const bountyDraftTemplates = {

//   };

// =====================
// FORM UTILITIES
// =====================

export const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

// =====================
// FORM HELPERS
// =====================

export const formatFormData = {
  createBounty: (data: CreateBountyForm) => ({
    ...data,
    deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
    repositoryUrl: data.repositoryUrl || undefined,
    issueUrl: data.issueUrl || undefined,
  }),
};

export const parseTagsInput = (value: string): string[] => {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const formatTagsOutput = (tags: string[]): string => {
  return tags.join(', ');
};

// =====================
// BETA APPLICATION FORM
// =====================

export const betaApplicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  twitter: z
    .string()
    .min(1, 'X/Twitter handle is required')
    .max(50, 'X/Twitter handle too long'),
  projectName: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name too long'),
  projectLink: z
    .string()
    .url('Please enter a valid URL')
    .min(1, 'Project link is required')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Project link must start with https://'
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
});

export type BetaApplicationForm = z.infer<typeof betaApplicationSchema>;

export const betaApplicationDefaults: BetaApplicationForm = {
  name: '',
  twitter: '',
  projectName: '',
  projectLink: '',
  description: '',
};

// =====================
// USERNAME/HANDLE FORMS
// =====================

export const handleSchema = z
  .string()
  .min(3, 'Handle must be at least 3 characters')
  .max(20, 'Handle must be at most 20 characters')
  .regex(/^[a-z0-9_-]+$/, 'Handle can only contain lowercase letters, numbers, hyphens, and underscores')
  .refine((val) => !(val.startsWith('-') || val.endsWith('-')), {
    message: 'Handle cannot start or end with a hyphen',
  })
  .refine((val) => !(val.startsWith('_') || val.endsWith('_')), {
    message: 'Handle cannot start or end with an underscore',
  });

export const checkHandleSchema = z.object({
  handle: handleSchema,
});

export const setHandleSchema = z.object({
  handle: handleSchema,
});

export type CheckHandleForm = z.infer<typeof checkHandleSchema>;
export type SetHandleForm = z.infer<typeof setHandleSchema>;

// =====================
// FUTURE FORMS
// =====================

// Profile form schema (placeholder for future)
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().optional(),
  twitter: z.string().optional(),
  isProfilePrivate: z.boolean().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;

// =====================
// TASK FORM (for dashboard task creation)
// =====================

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title too long"),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(1000, "Task description too long"),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], {
    message: "Please select a priority",
  }),
});

export type TaskForm = z.infer<typeof taskSchema>;

export const taskDefaults: TaskForm = {
  title: "",
  description: "",
  dueDate: undefined,
  priority: "medium",
};

// =====================
// SUBMISSION FORM
// =====================

export const submissionSchema = z.object({
  pullRequestUrl: z
    .string()
    .url("Please enter a valid pull request URL")
    .min(1, "Pull request URL is required")
    .refine(
      (url) =>
        url.includes("github.com") &&
        (url.includes("/pull/") || url.includes("/pulls/")),
      "Must be a GitHub pull request URL",
    ),
  notes: z
    .string()
    .max(500, "Notes too long (max 500 characters)")
    .optional()
    .or(z.literal("")),
});

export type SubmissionForm = z.infer<typeof submissionSchema>;

export const submissionDefaults: SubmissionForm = {
  pullRequestUrl: "",
  notes: "",
};

// =====================
// WAITLIST BOUNTY FORM
// =====================

// Email is always required, bounty fields are optional but validated if provided
export const waitlistEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Regex for amount validation (at top level for performance)
const AMOUNT_REGEX = /^\d{1,13}(\.\d{1,2})?$/;

// Helper: validates only if the field has content (not empty/undefined)
const optionalWithMinMax = (min: number, max: number, minMsg: string, maxMsg: string) =>
  z
    .string()
    .optional()
    .refine((val) => !val || val.length === 0 || val.length >= min, { message: minMsg })
    .refine((val) => !val || val.length <= max, { message: maxMsg });

export const waitlistBountySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  // Same validation as createBountySchema, but optional
  bountyTitle: optionalWithMinMax(1, 200, 'Title cannot be empty', 'Title too long'),
  bountyDescription: optionalWithMinMax(
    10,
    50_000,
    'Description must be at least 10 characters',
    'Description too long'
  ),
  bountyAmount: z
    .string()
    .optional()
    .refine((val) => !val || val.length === 0 || AMOUNT_REGEX.test(val), {
      message: 'Please enter a valid amount (e.g., 100 or 99.99)',
    }),
});

export type WaitlistEmailForm = z.infer<typeof waitlistEmailSchema>;
export type WaitlistBountyForm = z.infer<typeof waitlistBountySchema>;

// Add more form schemas as needed...
