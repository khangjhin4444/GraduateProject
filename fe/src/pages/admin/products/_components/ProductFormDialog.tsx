import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import { uploadImageToImgBB } from "@/app/action/upload-image";

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

export type Variant = {
  id: number;
  color: string;
  price: number;
  stock: number;
  file: File | null;
  url: string;
};

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(initType);
  const [subtype, setSubtype] = useState<string>(
    SUBTYPES[initType as keyof typeof SUBTYPES][0],
  );
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [variants, setVariants] = useState<Variant[]>([
    {
      id: Date.now(),
      color: "",
      price: 0,
      stock: 0,
      file: null,
      url: "",
    },
  ]);
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now(),
        color: "",
        price: 0,
        stock: 0,
        file: null,
        url: "",
      },
    ]);
    setExtraImages([]);
  };
  // useEffect(() => {
  //   if (!open) return;

  //   setName("");
  //   setDescription("");
  //   setType(initType);
  //   setSubtype("75%");
  //   setVariants([
  //     {
  //       id: Date.now(),
  //       color: "",
  //       price: 0,
  //       stock: 0,
  //       file: null,
  //       url: "",
  //     },
  //   ]);
  //   setExtraImages([]);
  // }, [open]);
  // useEffect(() => {
  //   setSubtype(SUBTYPES[type as keyof typeof SUBTYPES][0]);
  // }, [type]);
  const singleVariant = variants.length === 1;
  const saveMutation = useMutation({
    mutationFn: async () => handleSave(),
    onSuccess: () => {
      onOpenChange(false);
      onSaved(type);
      toast.success("Product saved successfully!");
    },
  });
  const handleSave = async () => {
    if (
      !name ||
      !description ||
      !type ||
      !subtype ||
      variants.some((v) => !v.color || v.price <= 0 || v.stock < 0 || !v.file)
    ) {
      toast.error("Please fill in all required fields.");
      throw new Error("Validation failed");
    }
    const colors = variants.map((v) => v.color.trim().toLowerCase());
    const uniqueColors = new Set(colors);
    const isUnique = uniqueColors.size === variants.length;
    if (!isUnique) {
      toast.error("Variant colors must be unique.");
      throw new Error("Validation failed: duplicate colors");
    }
    const uploadToImgBB = async (fileToUpload: File): Promise<string> => {
      try {
        const formData = new FormData();
        formData.append("image", fileToUpload);

        const response = await uploadImageToImgBB(formData);
        return response.data.url;
      } catch (error) {
        console.log(error);
        throw new Error("Lỗi từ server ImgBB");
      }
    };
    const mainImageURLs = await Promise.all(
      variants.map(async (v) => {
        if (v.file) {
          return await uploadToImgBB(v.file);
        }
        return null;
      }),
    );

    let extraImageURLs: string[] = [];
    if (extraImages.length > 0) {
      extraImageURLs = await Promise.all(
        extraImages.map(async (f) => {
          return await uploadToImgBB(f);
        }),
      );
    }
    const updatedVariants = variants.map((v, i) => ({
      ...v,
      url: mainImageURLs[i]!,
    }));
    setVariants(updatedVariants);
    const finalVariants = variants.map((v, i) => ({
      color: v.color,
      price: v.price,
      stock: v.stock,
      main_image: mainImageURLs[i]!,
    }));

    const payload = {
      name: name,
      description: description,
      productType: type,
      subType: subtype,
      variants: finalVariants,
      extraImages: extraImageURLs,
    };
    AdminUsecase.addProduct(payload);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
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
                <Field>
                  <FieldLabel>
                    Name<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Product name"
                    maxLength={120}
                  />
                </Field>
              </div>
              <div className="space-y-2">
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(v) => {
                      console.log("Type: ", v);
                      setType(v);
                      console.log("Subtype before: ", subtype);
                      console.log(
                        "Subtype change:",
                        SUBTYPES[v as keyof typeof SUBTYPES][0],
                      );
                      setSubtype(SUBTYPES[v as keyof typeof SUBTYPES][0]);
                      console.log("Subtype after: ", subtype);
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
              </div>
              <div className="space-y-2 ">
                <Field>
                  <FieldLabel>Subtype</FieldLabel>
                  <Select onValueChange={setSubtype} value={subtype}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBTYPES[type as keyof typeof SUBTYPES]?.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Field>
                  <FieldLabel>
                    Description<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Textarea
                    rows={3}
                    required
                    placeholder="Product description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                  />
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
                  onClick={() => handleAddVariant()}
                >
                  <Plus className="h-4 w-4" /> Add variant
                </Button>
              </div>
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-3 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-start gap-3">
                      <label className="relative cursor-pointer">
                        <ImageUploader idx={idx} setVariants={setVariants} />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-md opacity-0 hover:opacity-100 transition text-xs">
                          <Upload className="h-4 w-4" />
                        </span>
                      </label>

                      <div className="flex-1 grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Color<span className="text-destructive">*</span>
                          </Label>
                          <Input
                            required
                            value={v.color}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, color: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Black"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Price<span className="text-destructive">*</span>
                          </Label>
                          <Input
                            required
                            type="number"
                            step="0.01"
                            // value={v.price}
                            placeholder="0"
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, price: Number(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Stock<span className="text-destructive">*</span>
                          </Label>
                          <Input
                            required
                            type="number"
                            placeholder="0"
                            // value={v.stock}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, stock: Number(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={variants.length === 1}
                        onClick={() =>
                          setVariants((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {singleVariant && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Additional images</Label>
                    <p className="text-xs text-muted-foreground">
                      Available because the product has a single variant.
                    </p>
                  </div>
                  <label>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4" /> Upload
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setExtraImages((prev) => (f ? [...prev, f] : prev));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
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
                          setExtraImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
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
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
