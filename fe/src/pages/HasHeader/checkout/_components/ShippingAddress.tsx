import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { provincesData, type Province, type Ward } from "@/utils/addressData";
import { useMemo, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

export default function ShippingAddress({
  form,
}: {
  form: UseFormReturn<
    {
      name: string;
      phone: string;
      street: string;
      addressProvince: string;
      addressWard: string;
      request?: string | undefined;
      shipping: "Fast" | "Normal";
      payment: "Banking" | "COD";
      save: boolean;
    },
    {
      name: string;
      phone: string;
      street: string;
      addressProvince: string;
      addressWard: string;
      request?: string | undefined;
      shipping: "Fast" | "Normal";
      payment: "Banking" | "COD";
      save: boolean;
    }
  >;
}) {
  const [provinceCode, setProvinceCode] = useState<string>(
    provincesData.find((p) => p.name === form.getValues("addressProvince"))
      ?.province_code || "",
  );
  const [isValidAddress, setIsValidAddress] = useState(
    form.getValues("street") !== "" &&
      form.getValues("addressProvince") !== "" &&
      form.getValues("addressWard") !== "",
  );
  const [input, setInput] = useState(form.getValues("street"));
  const availableWards = useMemo(() => {
    return provincesData.find((p) => p.province_code === provinceCode)?.wards;
  }, [provinceCode]);
  return (
    <>
      <div className="block md:flex gap-6 mb-5">
        <Controller
          control={form.control}
          name="addressProvince"
          render={({ field, fieldState }) => {
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="province">
                  Province <span className="text-destructive text-lg">*</span>
                </FieldLabel>
                <Combobox
                  id="province"
                  items={provincesData}
                  value={field.value}
                  onValueChange={(value) => {
                    const selectedProvince = provincesData.find(
                      (p) => p.name === value,
                    );
                    field.onChange(value);
                    setProvinceCode(selectedProvince?.province_code || "");
                    form.setValue("addressWard", "");
                    if (
                      (form.getValues("street") !== "" || input) &&
                      form.getValues("addressWard") !== ""
                    ) {
                      setIsValidAddress(true);
                    } else {
                      setIsValidAddress(false);
                    }
                  }}
                >
                  <ComboboxInput
                    placeholder="Select Province"
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No provinces found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: Province) => (
                        <ComboboxItem
                          key={item.province_code}
                          value={item.name}
                        >
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            );
          }}
        />
        <Controller
          control={form.control}
          name="addressWard"
          render={({ field, fieldState }) => {
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ward">
                  Ward <span className="text-destructive text-lg">*</span>
                </FieldLabel>
                <Combobox
                  id="ward"
                  items={availableWards}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (form.getValues("street") !== "" || input !== "") {
                      setIsValidAddress(true);
                    } else {
                      setIsValidAddress(false);
                    }
                  }}
                >
                  <ComboboxInput
                    placeholder="Select Ward"
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No wards found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: Ward) => (
                        <ComboboxItem key={item.ward_code} value={item.name}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            );
          }}
        />
      </div>
      <Controller
        name="street"
        control={form.control}
        render={({ field, fieldState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="street">
                Detail Address{" "}
                <span className="text-destructive text-lg">*</span>
              </FieldLabel>
              <Input
                id="street"
                aria-invalid={fieldState.invalid}
                placeholder="Your delivery address"
                {...field}
                className="py-5"
                onChange={(e) => {
                  setInput(e.target.value);
                  field.onChange(e.target.value);
                  if (
                    e.target.value.trim() !== "" &&
                    form.getValues("addressProvince") !== "" &&
                    form.getValues("addressWard") !== ""
                  ) {
                    setIsValidAddress(true);
                  } else {
                    setIsValidAddress(false);
                  }
                }}
              />
              {fieldState.error && (
                <p className="text-[12px] text-red-500 font-semibold  pt-1">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          );
        }}
      />
      {isValidAddress ? (
        <p className="text-sm text-muted-foreground mt-4">
          Preview Shipping Address:{" "}
          {`${input}, ${form.getValues("addressWard")}, ${form.getValues("addressProvince")}`}
        </p>
      ) : (
        <p className="text-sm text-destructive mt-4">
          Please complete Shipping Address
        </p>
      )}
    </>
  );
}
