import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { z } from "zod";
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditorJsInput,
  type EditorData,
  type EditorJsInputHandle,
} from "./EditorJsInput";
import { Label } from "@/components/ui/label";
import { EditorDataSchema } from "@/features/admin/schema/admin.schema";
import VariantItem from "./VariantItem";
import { useSaveEdit } from "@/hooks/useSaveEdit";

const PRODUCT_TYPES: { value: string; label: string }[] = [
  { value: "KeyboardKit", label: "Keyboard Kit" },
  { value: "Prebuild", label: "Prebuild" },
  { value: "Keycap", label: "Keycap" },
  { value: "Switch", label: "Switch" },
];

const SUBTYPES: Record<string, string[]> = {
  KeyboardKit: ["Alice", "75%", "TKL", "Full Size"],
  Prebuild: ["Alice", "75%", "TKL", "Full Size"],
  Keycap: ["Cherry", "MDA", "SA", "Artisan"],
  Switch: ["Linear", "Tactile", "Clicky", "Silent"],
};

// For edit: variant image can be an existing URL (string) or a new File
const EditVariantSchema = z.object({
  variantId: z.number().optional(),
  color: z.string().min(1, { message: "Color is required" }),
  price: z
    .number({ message: "Price is required" })
    .min(1, { message: "Price must be at least 1" }),
  stock: z
    .number({ message: "Stock is required" })
    .min(0, { message: "Stock cannot be negative" }),
  file: z.file().optional(), // New file (optional if keeping existing image)
  existingImage: z.string().optional(), // Existing URL from DB
});

export type EditVariantEntity = z.infer<typeof EditVariantSchema>;

// For edit: extra images can be existing URLs or new Files
export type ExtraImageItem =
  | { type: "existing"; url: string }
  | { type: "new"; file: File; previewUrl: string };

const EditProductFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Please fill this field" })
    .max(120, { message: "Product's name must be at most 120 characters" }),
  type: z.enum(["KeyboardKit", "Prebuild", "Keycap", "Switch"]),
  subtype: z.string(),
  description: EditorDataSchema,
  variants: z
    .array(EditVariantSchema)
    .min(1, { message: "At least one variant is required" })
    .refine((variants) => variants.every((v) => v.file || v.existingImage), {
      message: "Each variant must have an image",
    }),
});

export type EditProductForm = z.infer<typeof EditProductFormSchema>;

/** Data shape passed from the product table row */
export type EditProductData = {
  ProductID: number;
  Name: string;
  Description: {
    time?: number;
    blocks: Array<{ id?: string; type: string; data: Record<string, unknown> }>;
    version?: string;
  };
  ProductType: string;
  SubType: string;
  variants: Array<{
    VariantID: number;
    Color: string;
    Price: number;
    Stock: number;
    MainImage: string;
  }>;
  images: string[];
};

function getDefaultFormValues(productData: EditProductData): EditProductForm {
  return {
    name: productData.Name,
    type: productData.ProductType as EditProductForm["type"],
    subtype: productData.SubType,
    description: productData.Description,
    variants: productData.variants.map((variant) => ({
      variantId: variant.VariantID,
      color: variant.Color,
      price: variant.Price,
      stock: variant.Stock,
      file: undefined,
      existingImage: variant.MainImage,
    })),
  };
}

function revokePreviewUrls(images: ExtraImageItem[]) {
  images.forEach((image) => {
    if (image.type === "new") {
      URL.revokeObjectURL(image.previewUrl);
    }
  });
}

export function EditProductFormDialog({
  productData,
  open,
  onOpenChange,
  onSaved,
}: {
  productData: EditProductData;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (type: string) => void;
}) {
  const editorRef = useRef<EditorJsInputHandle>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<ExtraImageItem[]>(() =>
    productData.images.map((url) => ({ type: "existing" as const, url })),
  );
  const extraImagesRef = useRef(extraImages);

  const form = useForm<EditProductForm>({
    resolver: zodResolver(EditProductFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: getDefaultFormValues(productData),
  });

  useEffect(
    () => () => {
      revokePreviewUrls(extraImagesRef.current);
    },
    [],
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });
  const oldVariants = fields.map((field) => {
    return {
      id: field.variantId,
      color: field.color,
    };
  });

  const handleAddExtraImage = (newFile: File) => {
    const previewUrl = URL.createObjectURL(newFile);
    const nextExtraImages: ExtraImageItem[] = [
      ...extraImagesRef.current,
      { type: "new", file: newFile, previewUrl },
    ];
    extraImagesRef.current = nextExtraImages;
    setExtraImages(nextExtraImages);
  };

  const handleRemoveExtraImage = (indexToRemove: number) => {
    const imageToRemove = extraImagesRef.current[indexToRemove];
    if (!imageToRemove) return;
    if (imageToRemove.type === "new") {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    const nextExtraImages = extraImagesRef.current.filter(
      (_, index) => index !== indexToRemove,
    );
    extraImagesRef.current = nextExtraImages;
    setExtraImages(nextExtraImages);
  };

  const saveMutation = useSaveEdit({
    productId: productData.ProductID,
    oldVariants,
    extraImages,
    onOpenChange,
    onSaved,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            // Imperatively save editor data before RHF validation
            try {
              const editorData = await editorRef.current?.save();
              if (editorData) {
                form.setValue("description", editorData, {
                  shouldValidate: false,
                });
              }
            } catch (err) {
              setDescriptionError(
                err instanceof Error
                  ? err.message
                  : "Unable to save the product description",
              );
              return;
            }
            // Now trigger RHF validation + submit
            const onValid = (data: EditProductForm) => {
              setDescriptionError(null);
              saveMutation.mutate(data);
            };
            const onInvalid = (errors: FieldErrors<EditProductForm>) => {
              // Surface description error from Zod
              if (errors.description) {
                setDescriptionError(
                  errors.description.blocks?.message ??
                    errors.description.message ??
                    "Please enter a product description",
                );
              } else {
                setDescriptionError(null);
              }
            };
            await form.handleSubmit(onValid, onInvalid)();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>
              Modify product details, variants and images.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Name<span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="Product name"
                        />
                        {fieldState.error && (
                          <p className="text-[12px] text-red-500 font-semibold ml-3 pt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
              <div className="space-y-2">
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => {
                    return (
                      <Field>
                        <FieldLabel>Type</FieldLabel>
                        <Select
                          {...field}
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const defaultSubtype =
                              SUBTYPES[v as keyof typeof SUBTYPES][0];
                            form.setValue("subtype", defaultSubtype);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  }}
                />
              </div>
              <div className="space-y-2 ">
                <Controller
                  control={form.control}
                  name="subtype"
                  render={({ field }) => {
                    return (
                      <Field>
                        <FieldLabel>Subtype</FieldLabel>
                        <Select
                          {...field}
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBTYPES[
                              form.getValues("type") as keyof typeof SUBTYPES
                            ]?.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  }}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Field data-invalid={!!descriptionError}>
                  <FieldLabel>
                    Description<span className="text-destructive">*</span>
                  </FieldLabel>
                  <EditorJsInput
                    ref={editorRef}
                    initialData={productData.Description as EditorData}
                  />
                  {descriptionError && (
                    <p className="text-[12px] text-red-500 font-semibold ml-3 pt-2">
                      {descriptionError}
                    </p>
                  )}
                </Field>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      variantId: undefined,
                      color: "",
                      price: 0,
                      stock: 0,
                      file: undefined,
                      existingImage: undefined,
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add variant
                </Button>
              </div>
              {form.formState.errors.variants?.root && (
                <p className="text-[12px] text-red-500 font-semibold ml-3">
                  {form.formState.errors.variants.root.message}
                </p>
              )}
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <VariantItem
                    key={field.id}
                    control={form.control}
                    fields={fields}
                    form={form}
                    idx={idx}
                    remove={remove}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-base">Additional images</Label>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <label className="relative block w-20 h-20">
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-secondary rounded-xl">
                    <Upload className="h-5 w-5" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAddExtraImage(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {extraImages.map((item, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={
                        item.type === "existing" ? item.url : item.previewUrl
                      }
                      alt={"Extra image preview"}
                      className="object-cover rounded-md h-20 w-20"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => {
                        handleRemoveExtraImage(i);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {extraImages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No extra images yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-transparent">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="cursor-pointer"
            >
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
