import { z } from "zod";

export const OrderProductSchema = z.object({
  VariantID: z.number(),
  Name: z.string(),
  ProductType: z.string(),
  SubType: z.string(),
  Color: z.string(),
  MainImage: z.string(),
  Price: z.string(),
  Quantity: z.number(),
});

export const PrepareOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  warnings: z.number(),
  totalQuantity: z.number(),
  subTotal: z.number(),
  items: z.array(OrderProductSchema),
});

export const PlaceOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  orderId: z.number(),
});

export type PlaceOrderResponseEntity = z.infer<typeof PlaceOrderResponseSchema>;

export type PrepareOrderResponseEntity = z.infer<
  typeof PrepareOrderResponseSchema
>;
export type OrderProdudctEntity = z.infer<typeof OrderProductSchema>;
