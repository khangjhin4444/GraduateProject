import { z } from "zod";
export const VariantSchema = z.object({
  VariantID: z.number(),
  Color: z.string(),
  Price: z.number(),
  Stock: z.number(),
  MainImage: z.string(),
});
export const ProductDetailSchema = z.object({
  success: z.boolean(),
  data: z.object({
    ProductID: z.number(),
    Name: z.string(),
    ProductType: z.string(),
    Description: z.string(),
    SubType: z.string(),
    images: z.array(z.string()),
    variants: z.array(VariantSchema).min(1),
  }),
});

export type VariantEntity = z.infer<typeof VariantSchema>;
export type ProductDetailResponseEntity = z.infer<typeof ProductDetailSchema>;
