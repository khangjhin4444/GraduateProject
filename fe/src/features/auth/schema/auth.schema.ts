import { z } from "zod";

export const RegisterSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const LoginSchema = z
  .object({
    success: z.boolean(),
    accessToken: z.string(),
    user: z.object({
      id: z.number(),
      cartQuantity: z.string(),
      Name: z.string().nullable(),
      Phone: z.string().nullable(),
      Address: z.preprocess(
        (val) => {
          if (!val || val === "null") return null;
          if (typeof val === "string") {
            return JSON.parse(val);
          }
          return val;
        },
        z
          .object({
            street: z.string(),
            wardName: z.string(),
            provinceName: z.string(),
          })
          .nullable(),
      ),

      role: z.enum(["user", "admin"]),
    }),
  })
  .transform((data) => {
    return {
      success: data.success,
      accessToken: data.accessToken,
      user: {
        id: data.user.id,
        cartQuantity: data.user.cartQuantity,
        Name: data.user.Name,
        Phone: data.user.Phone,
        role: data.user.role,
        street: data.user.Address?.street || "",
        wardName: data.user.Address?.wardName || "",
        provinceName: data.user.Address?.provinceName || "",
      },
    };
  });
export type LoginErrorResponse = {
  success: boolean;
  message: string;
};

export type LoginResponseEntity = z.infer<typeof LoginSchema>;
export type RegisterResponseEntity = z.infer<typeof RegisterSchema>;
