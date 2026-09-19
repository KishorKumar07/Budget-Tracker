import { z } from "zod";

export const updateReminderSchema = z.object({
  reminderEnabled: z.coerce.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time."),
});

export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
