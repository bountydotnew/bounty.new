import { z } from "zod";

// =====================
// BOUNTY FORMS
// =====================

export const createBountySchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),

  amount: z
    .string()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, "Incorrect amount.")
    .min(1, "Amount cannot be empty")
    .max(10000000000, "Amount cannot be greater than 100,000"),
  currency: z.string().min(1, "Currency cannot be empty"),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    errorMap: () => ({ message: "Difficulty cannot be empty" }),
  }),
  deadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  issueUrl: z.string().url().optional().or(z.literal("")),
});

export type CreateBountyForm = z.infer<typeof createBountySchema>;

export const createBountyDefaults: CreateBountyForm = {
  title: "",
  description: "",
  amount: "",
  currency: "USD",
  difficulty: "intermediate",
  deadline: "",
  tags: [],
  repositoryUrl: "",
  issueUrl: "",
};

// Draft templates for bounty creation
 //export const bountyDraftTemplates = {

//   };

// =====================
// FORM UTILITIES
// =====================

export const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

export const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
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
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const formatTagsOutput = (tags: string[]): string => {
  return tags.join(", ");
};

// =====================
// BETA APPLICATION FORM
// =====================

export const betaApplicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  twitter: z
    .string()
    .min(1, "X/Twitter handle is required")
    .max(50, "X/Twitter handle too long"),
  projectName: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name too long"),
  projectLink: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Project link is required")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "Project link must start with https://",
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),
});

export type BetaApplicationForm = z.infer<typeof betaApplicationSchema>;

export const betaApplicationDefaults: BetaApplicationForm = {
  name: "",
  twitter: "",
  projectName: "",
  projectLink: "",
  description: "",
};

// =====================
// FUTURE FORMS
// =====================

// Profile form schema (placeholder for future)
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name too long"),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  github: z.string().optional(),
  twitter: z.string().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;

// Add more form schemas as needed...
