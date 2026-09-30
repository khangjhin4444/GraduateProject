import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { Field, FieldLabel } from "@/components/ui/field";
import { z } from "zod";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditorJsInput, type EditorJsInputHandle } from "./EditorJsInput";
import { Label } from "@/components/ui/label";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import { EditorDataSchema } from "@/features/admin/schema/admin.schema";
import { AxiosError } from "axios";

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

const VariantSchema = z.object({
  id: z.number(),
  color: z.string().min(1, { message: "Color is required" }),
  price: z
    .number({ message: "Price is required" })
    .min(1, { message: "Price must be at least 1" }),
  stock: z
    .number({ message: "Stock is required" })
    .min(1, { message: "Stock must be at least 1" }),
  file: z
    .file()
    .optional()
    .refine((val) => val !== undefined && val !== null, {
      message: "Image is required",
    }),
  main_image: z.string(),
});

export type ProductDescription = z.infer<typeof EditorDataSchema>;

const ProductFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Please fill this field" })
    .max(120, { message: "Product's name must be at most 120 characters" }),
  type: z.enum(["KeyboardKit", "Prebuild", "Keycap", "Switch"]),
  subtype: z.string(),
  description: EditorDataSchema,
  variants: z
    .array(VariantSchema)
    .min(1, { message: "At least one variant is required" }),
  extraImages: z.array(z.file()),
});

type ProductForm = z.infer<typeof ProductFormSchema>;

export function ProductFormDialog({
  initType,
  open,
  onOpenChange,
  onSaved,
}: {
  initType: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (type: string) => void;
}) {
  const editorRef = useRef<EditorJsInputHandle>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const form = useForm<ProductForm>({
    resolver: zodResolver(ProductFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      type: "KeyboardKit",
      subtype: SUBTYPES[initType][0],
      description: {
        time: 0,
        blocks: [],
        version: "2.31.7",
      },
      variants: [
        {
          id: 0,
          color: "",
          price: 0,
          stock: 0,
          file: undefined,
          main_image: "",
        },
      ],
      extraImages: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });
  const extraImages = useWatch({
    control: form.control,
    name: "extraImages",
  });

  const handleAddExtraImage = (newFile: File) => {
    const currentImages = form.getValues("extraImages");
    form.setValue("extraImages", [...currentImages, newFile], {
      shouldValidate: true, // Kích hoạt validate
      shouldDirty: true,
    });
  };

  const handleRemoveExtraImage = (indexToRemove: number) => {
    const currentImages = form.getValues("extraImages");
    form.setValue(
      "extraImages",
      currentImages.filter((_, index) => index !== indexToRemove),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const [type, setType] = useState<string>(initType);

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => handleSave(data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved(type);
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
  const handleSave = async (data: ProductForm) => {
    const colors = data.variants.map((v) => v.color.trim().toLowerCase());
    const uniqueColors = new Set(colors);
    const isUnique = uniqueColors.size === data.variants.length;
    if (!isUnique) {
      toast.error("Variant colors must be unique.");
      throw new Error("Validation failed: duplicate colors");
    }

    // Build FormData to send files + data to backend
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("productType", data.type);
    formData.append("subType", data.subtype);
    formData.append("description", JSON.stringify(data.description));

    // Append variant metadata as JSON (without file/main_image)
    const variantsMeta = data.variants.map((v) => ({
      color: v.color,
      price: v.price,
      stock: v.stock,
    }));
    formData.append("variants", JSON.stringify(variantsMeta));

    // Append variant images in order
    data.variants.forEach((v) => {
      if (v.file) {
        formData.append("variantImages", v.file);
      }
    });

    // Append extra images
    data.extraImages.forEach((f) => {
      formData.append("extraImages", f);
    });

    await AdminUsecase.addProduct(formData);
  };

  function onSubmit(data: ProductForm) {
    saveMutation.mutate(data);
  }

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
              console.error("Editor save failed:", err);
            }
            // Now trigger RHF validation + submit
            const onValid = (data: ProductForm) => {
              setDescriptionError(null);
              // saveMutation.mutate();
              onSubmit(data);
            };
            const onInvalid = (errors: FieldErrors<ProductForm>) => {
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
            <DialogTitle>{"New product"}</DialogTitle>
            <DialogDescription>
              Configure product details, variants and images.
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
                          value={type}
                          onValueChange={(v) => {
                            field.onChange(v);
                            setType(v!);

                            form.setValue(
                              "subtype",
                              SUBTYPES[v as keyof typeof SUBTYPES][0],
                            );
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
                            {SUBTYPES[type as keyof typeof SUBTYPES]?.map(
                              (s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ),
                            )}
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
                  <EditorJsInput ref={editorRef} />
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
                      id: Date.now(),
                      color: "",
                      price: 0,
                      stock: 0,
                      file: undefined,
                      main_image: "",
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
                  <div
                    key={field.id}
                    className="rounded-lg border p-3 space-y-3 bg-muted/30"
                  >
                    <div className="block md:flex items-start gap-3">
                      <div>
                        <ImageUploader
                          key={idx}
                          onFileChange={(file) => {
                            form.setValue(`variants.${idx}.file`, file, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                        {form.formState.errors.variants?.[idx]?.file
                          ?.message && (
                          <p className="text-[12px] text-red-500 font-semibold mt-1">
                            {form.formState.errors.variants[idx].file.message}
                          </p>
                        )}
                      </div>

                      <div className="flex-1 grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Controller
                            control={form.control}
                            name={`variants.${idx}.color`}
                            render={({ field, fieldState }) => (
                              <>
                                <Label className="text-xs">
                                  Color
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  {...field}
                                  aria-invalid={fieldState.invalid}
                                  placeholder="Black"
                                />
                                {fieldState.error && (
                                  <p className="text-[12px] text-red-500 font-semibold">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Controller
                            control={form.control}
                            name={`variants.${idx}.price`}
                            render={({ field, fieldState }) => (
                              <>
                                <Label className="text-xs">
                                  Price
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0,
                                    )
                                  }
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.error && (
                                  <p className="text-[12px] text-red-500 font-semibold">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Controller
                            control={form.control}
                            name={`variants.${idx}.stock`}
                            render={({ field, fieldState }) => (
                              <>
                                <Label className="text-xs">
                                  Stock
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0,
                                    )
                                  }
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.error && (
                                  <p className="text-[12px] text-red-500 font-semibold">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length === 1}
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
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
                {extraImages.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={"Extra image preview"}
                      className="object-cover rounded-md h-20 w-20"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition"
                      onClick={async () => {
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
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
