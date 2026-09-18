import { z } from "zod";

export const RegisterSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type RegisterResponseEntity = z.infer<typeof RegisterSchema>;
