import { z } from "zod";

export const AddToCartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newQuantity: z.number().optional(),
});

const CartItemSchema = z.object({
  CartItemID: z.number(),
  Quantity: z.number(),
  MainImage: z.string(),
  Price: z.string(),
  Name: z.string(),
  Color: z.string(),
  Stock: z.number(),
  VariantID: z.number(),
  ProductType: z.string(),
  SubType: z.string(),
});

export const GetCartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  items: z.array(CartItemSchema),
});

export const ChangeItemQuantityResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ChangeItemQuantityResponseEntity = z.infer<
  typeof ChangeItemQuantityResponseSchema
>;
export type AddToCartResponseEntity = z.infer<typeof AddToCartResponseSchema>;
export type CartItemEntity = z.infer<typeof CartItemSchema>;
export type GetCartResponseEntity = z.infer<typeof GetCartResponseSchema>;
