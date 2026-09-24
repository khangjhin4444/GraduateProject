import { z } from "zod";

export const RegisterSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const LoginSchema = z.object({
  success: z.boolean(),
  accessToken: z.string(),
  user: z.object({
    id: z.number(),
    cartQuantity: z.string(),
    Name: z.string().nullable(),
    Phone: z.string().nullable(),
    Address: z.string().nullable(),
    role: z.enum(["user", "admin"]),
  }),
});

export type LoginErrorResponse = {
  success: boolean;
  message: string;
};

export type LoginResponseEntity = z.infer<typeof LoginSchema>;
export type RegisterResponseEntity = z.infer<typeof RegisterSchema>;
