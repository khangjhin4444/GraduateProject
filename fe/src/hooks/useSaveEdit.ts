import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type {
  EditProductData,
  EditProductForm,
  ExtraImageItem,
} from "@/pages/admin/products/_components/EditProductFormDialog";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

type ExistingVariant = {
  id?: number;
  color: string;
};

type UseSaveEditOptions = {
  productId: EditProductData["ProductID"];
  oldVariants: ExistingVariant[];
  extraImages: ExtraImageItem[];
  onOpenChange: (open: boolean) => void;
  onSaved: (type: string) => void;
};

export function useSaveEdit({
  productId,
  oldVariants,
  extraImages,
  onOpenChange,
  onSaved,
}: UseSaveEditOptions) {
  return useMutation({
    mutationFn: async (data: EditProductForm) => {
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

      const variantsMeta = data.variants.map((variant) => {
        const matchingVariant = oldVariants.find(
          (oldVariant) =>
            oldVariant.color.trim().toLowerCase() ===
            variant.color.trim().toLowerCase(),
        );
        const variantId = matchingVariant
          ? matchingVariant.id
          : variant.variantId;

        return {
          variantId,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          existingImage: variant.file ? undefined : variant.existingImage,
        };
      });
      formData.append("variants", JSON.stringify(variantsMeta));

      data.variants.forEach((variant) => {
        if (variant.file) {
          formData.append("variantImages", variant.file);
        }
      });

      const existingExtraURLs = extraImages
        .filter(
          (image): image is { type: "existing"; url: string } =>
            image.type === "existing",
        )
        .map((image) => image.url);
      formData.append("existingExtraImages", JSON.stringify(existingExtraURLs));

      extraImages.forEach((image) => {
        if (image.type === "new") {
          formData.append("extraImages", image.file);
        }
      });

      await AdminUsecase.editProduct(productId, formData);
    },
    onSuccess: (_, data) => {
      onOpenChange(false);
      onSaved(data.type);
      toast.success("Product updated successfully!");
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
