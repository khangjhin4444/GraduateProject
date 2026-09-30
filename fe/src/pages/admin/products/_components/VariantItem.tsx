import {
  Controller,
  useWatch,
  type Control,
  type UseFieldArrayRemove,
  type UseFormReturn,
} from "react-hook-form";
import type {
  EditProductForm,
  EditVariantEntity,
} from "./EditProductFormDialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
export default function VariantItem({
  control,
  idx,
  form,
  remove,
  fields,
}: {
  control: Control<EditProductForm>;
  idx: number;
  form: UseFormReturn<EditProductForm>;
  remove: UseFieldArrayRemove;
  fields: EditVariantEntity[];
}) {
  const existingImage = useWatch({
    control,
    name: `variants.${idx}.existingImage`,
  });
  return (
    <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
      <div className="block md:flex items-start gap-3">
        <div>
          <ImageUploader
            key={idx}
            value={existingImage ?? undefined}
            onFileChange={(file) => {
              form.setValue(`variants.${idx}.file`, file, {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.trigger("variants");
            }}
          />
          {form.formState.errors.variants?.[idx]?.file?.message &&
            !existingImage && (
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
                        e.target.value ? Number(e.target.value) : 0,
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
                        e.target.value ? Number(e.target.value) : 0,
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
  );
}
