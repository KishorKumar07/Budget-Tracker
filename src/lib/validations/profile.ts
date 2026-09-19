import { z } from "zod";

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "SGD"] as const;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
  "UTC",
] as const;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Keep it under 80 characters."),
  currency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
