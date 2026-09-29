import { z } from "zod";

export const AddToCartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newQuantity: z.number().optional(),
});
export type AddToCartResponseEntity = z.infer<typeof AddToCartResponseSchema>;
