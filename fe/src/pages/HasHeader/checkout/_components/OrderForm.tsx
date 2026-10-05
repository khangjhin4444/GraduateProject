import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { OrderProdudctEntity } from "@/features/order/schema/order.schema";
import type { PlaceOrderProps } from "@/features/order/service/order.service";
import { useAppSelector } from "@/state/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { clsx } from "clsx";
import { HandCoins, MapPinHouse, Truck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const OrderFormSchema = z.object({
  name: z.string().min(1, { message: "Please fill this field" }),
  phone: z.string().regex(/^\d{10}$/, {
    message: "Phone number must contains 10 numbers",
  }),
  address: z.string().min(1, { message: "Please fill this field" }),
  request: z.string().optional(),
  shipping: z.literal("Normal").or(z.literal("Fast")),
  payment: z.literal("COD").or(z.literal("Banking")),
  save: z.boolean(),
});
export type OrderForm = z.infer<typeof OrderFormSchema>;

export default function OrderForm({
  items,
  setShipping,
  placeOrderMutation,
}: {
  items: OrderProdudctEntity[];
  setShipping: React.Dispatch<React.SetStateAction<number>>;
  placeOrderMutation: UseMutationResult<
    {
      success: boolean;
      message: string;
      orderId: number;
    },
    Error,
    PlaceOrderProps,
    {
      toastId: string | number;
    }
  >;
}) {
  const profile = useAppSelector((state) => state.profile);
  const form = useForm<OrderForm>({
    resolver: zodResolver(OrderFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: profile.fullName,
      phone: profile.phoneNumber,
      address: profile.address,
      request: "",
      shipping: "Normal",
      payment: "COD",
      save: true,
    },
  });

  const [isBank, setIsBank] = useState<boolean>(false);

  async function onSubmit(data: OrderForm) {
    const payload = {
      ...data,
      variantIds: items.map((item) => item.VariantID),
    };
    await placeOrderMutation.mutateAsync(payload);

    console.log(payload);
  }
  return (
    <div className="mt-7 ">
      <div className="flex items-center gap-5 border-b pb-2 mb-5">
        <div className="bg-muted/25 p-2 rounded-lg">
          <MapPinHouse className="text-primary" />
        </div>

        <div>
          <p className="text-md text-muted-foreground">Step 1</p>
          <p className="font-semibold text-foreground text-lg">
            Contact and Delivery
          </p>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} id="checkout-form">
        <div className="block md:flex gap-6 mb-5">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your Name"
                    {...field}
                    value={field.value}
                    className="py-5"
                  />
                  {fieldState.error && (
                    <p className="text-[12px] text-red-500 font-semibold pt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              );
            }}
          />

          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="0123456789"
                    {...field}
                    value={field.value}
                    className="py-5"
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
        </div>
        <div className="mb-5">
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address">Delivery Address</FieldLabel>
                  <Input
                    id="address"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your delivery address"
                    {...field}
                    value={field.value}
                    className="py-5"
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
        </div>
        <div>
          <Controller
            name="request"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="request">
                    Order Note (Optional)
                  </FieldLabel>
                  <Textarea
                    id="request"
                    aria-invalid={fieldState.invalid}
                    placeholder="Notes about yout order or delivery"
                    {...field}
                    value={field.value}
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
        </div>
        <div className="mt-6">
          <Controller
            control={form.control}
            name="save"
            render={({ field }) => {
              return (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="terms-checkbox-basic"
                    name="terms-checkbox-basic"
                    className="w-5 h-5"
                  />
                  <FieldLabel htmlFor="terms-checkbox-basic">
                    Save Shipping information
                  </FieldLabel>
                </Field>
              );
            }}
          />
        </div>

        <div className="flex items-center gap-5 border-b pb-2 mb-5 mt-10">
          <div className="bg-muted/25 p-2 rounded-lg">
            <Truck className="text-primary" />
          </div>

          <div>
            <p className="text-md text-muted-foreground">Step 2</p>
            <p className="font-semibold text-foreground text-lg">
              Shipping Method
            </p>
          </div>
        </div>
        <Controller
          control={form.control}
          name="shipping"
          render={({ field }) => {
            return (
              <RadioGroup
                defaultValue={field.value}
                className="md:flex"
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "Fast") {
                    setShipping(isBank ? 40 : 80);
                  } else setShipping(isBank ? 20 : 40);
                }}
              >
                <FieldLabel htmlFor="standard">
                  <Field orientation="horizontal">
                    <div className="flex gap-4 items-center justify-center w-full py-3 px-2">
                      <RadioGroupItem
                        value="Normal"
                        id="standard"
                        className="border-primary"
                      />
                      <FieldContent>
                        <FieldTitle>Standard Delivery</FieldTitle>
                        <FieldDescription>2-4 business day</FieldDescription>
                      </FieldContent>
                      <div>
                        <p
                          className={clsx(
                            "ms-auto font-semibold {}",
                            isBank
                              ? "text-muted-foreground font-normal line-through"
                              : "text-foreground",
                          )}
                        >
                          40.000 VND
                        </p>
                        <p
                          className={clsx(
                            "ms-auto font-semibold",
                            isBank ? "block" : "hidden",
                          )}
                        >
                          20.000 VND
                        </p>
                      </div>
                    </div>
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="express">
                  <Field orientation="horizontal">
                    <div className="flex gap-4 items-center w-full py-3 px-2">
                      <RadioGroupItem
                        value="Fast"
                        id="express"
                        className="border-primary"
                      />
                      <FieldContent>
                        <FieldTitle>Express Delivery</FieldTitle>
                        <FieldDescription>1-2 busines day</FieldDescription>
                      </FieldContent>
                      <div>
                        <p
                          className={clsx(
                            "ms-auto font-semibold {}",
                            isBank
                              ? "text-muted-foreground font-normal line-through"
                              : "text-foreground",
                          )}
                        >
                          80.000 VND
                        </p>
                        <p
                          className={clsx(
                            "ms-auto font-semibold",
                            isBank ? "block" : "hidden",
                          )}
                        >
                          40.000 VND
                        </p>
                      </div>
                    </div>
                  </Field>
                </FieldLabel>
              </RadioGroup>
            );
          }}
        />
        <div className="flex items-center gap-5 border-b pb-2 mb-5 mt-10">
          <div className="bg-muted/25 p-2 rounded-lg">
            <HandCoins className="text-primary" />
          </div>

          <div>
            <p className="text-md text-muted-foreground">Step 3</p>
            <p className="font-semibold text-foreground text-lg">
              Payment Method
            </p>
          </div>
        </div>
        <div className="mb-10">
          <Controller
            control={form.control}
            name="payment"
            render={({ field }) => {
              return (
                <RadioGroup
                  defaultValue={field.value}
                  className="md:flex"
                  onValueChange={(value) => {
                    if (value === "COD") {
                      setIsBank(false);
                      setShipping((prev) => prev * 2);
                    } else {
                      setIsBank(true);
                      setShipping((prev) => prev / 2);
                    }
                    field.onChange(value);
                  }}
                >
                  <FieldLabel htmlFor="cod">
                    <Field orientation="horizontal">
                      <div className="flex gap-4 items-center justify-center w-full py-3 px-2">
                        <RadioGroupItem
                          value="COD"
                          id="cod"
                          className="border-primary"
                          onChange={() => setIsBank(false)}
                        />
                        <FieldContent>
                          <FieldTitle>Cash on delivery</FieldTitle>
                          <FieldDescription>
                            Pay when your order arrives
                          </FieldDescription>
                        </FieldContent>
                      </div>
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="bank">
                    <Field orientation="horizontal">
                      <div className="flex gap-4 items-center w-full py-3 px-2">
                        <RadioGroupItem
                          value="Banking"
                          id="bank"
                          className="border-primary"
                          onChange={() => setIsBank(true)}
                        />
                        <FieldContent>
                          <FieldTitle>Banking transfer</FieldTitle>
                          <FieldDescription>
                            Paynow and get 50% discount on Shipping
                          </FieldDescription>
                        </FieldContent>
                      </div>
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              );
            }}
          />
        </div>
      </form>
    </div>
  );
}
