import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type { ProductForm } from "@/pages/admin/products/_components/ProductFormDialog";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

type UseSaveProductOptions = {
  onOpenChange: (open: boolean) => void;
  onSaved: (type: string) => void;
};

export function useSaveProduct({
  onOpenChange,
  onSaved,
}: UseSaveProductOptions) {
  return useMutation({
    mutationFn: async (data: ProductForm) => {
      const colors = data.variants.map((variant) =>
        variant.color.trim().toLowerCase(),
      );
      if (new Set(colors).size !== data.variants.length) {
        throw new Error("Variant colors must be unique.");
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("productType", data.type);
      formData.append("subType", data.subtype);
      formData.append("description", JSON.stringify(data.description));

      formData.append(
        "variants",
        JSON.stringify(
          data.variants.map((variant) => ({
            color: variant.color,
            price: variant.price,
            stock: variant.stock,
          })),
        ),
      );

      data.variants.forEach((variant) => {
        if (variant.file) {
          formData.append("variantImages", variant.file);
        }
      });

      data.extraImages.forEach((file) => {
        formData.append("extraImages", file);
      });

      await AdminUsecase.addProduct(formData);
    },
    onSuccess: (_, data) => {
      onOpenChange(false);
      onSaved(data.type);
      toast.success("Product saved successfully!");
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
    },
  });
}
