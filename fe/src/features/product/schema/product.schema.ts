import { z } from "zod";
export const VariantSchema = z.object({
  VariantID: z.number(),
  Color: z.string(),
  Price: z.number(),
  Stock: z.number(),
  MainImage: z.string(),
});
export const ProductDetailSchema = z.object({
  ProductID: z.number(),
  Name: z.string(),
  ProductType: z.string(),
  Description: z.string(),
  SubType: z.string(),
  images: z.array(z.string()),
  variants: z.array(VariantSchema).min(1),
});

export const ProductDetailResponseSchema = z.object({
  success: z.boolean(),
  data: ProductDetailSchema,
});

export const SimpleVariantSchema = z.object({
  colorText: z.string(),
  image: z.string(),
  price: z.number(),
});

export const ProductSchema = z.object({
  ProductID: z.number(),
  Name: z.string(),
  ProductType: z.string(),
  Description: z.string(),
  SubType: z.string(),
  MainImage: z.string(),
  Price: z.string(),
  variants: z.array(SimpleVariantSchema).min(1),
});

export const ProductResponseSchema = z.object({
  success: z.boolean(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
  data: z.array(ProductSchema),
});

export type VariantEntity = z.infer<typeof VariantSchema>;
export type ProductDetailResponseEntity = z.infer<
  typeof ProductDetailResponseSchema
>;
export type ProductResponseEntity = z.infer<typeof ProductResponseSchema>;

export type ProductDetailEntity = z.infer<typeof ProductDetailSchema>;
export type ProductEntity = z.infer<typeof ProductSchema>;
export type SimpleVariant = z.infer<typeof SimpleVariantSchema>;
