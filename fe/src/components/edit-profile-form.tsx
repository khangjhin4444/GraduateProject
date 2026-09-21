"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
// import { UserUsecase } from "@/features/user/usecase/user.usecase";

import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setInfo } from "@/state/profile/profileSlice";
import { useEffect } from "react";

const formSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters."),
  name: z.string(),
  phone: z
    .string()
    .min(10, "Phone number must min have 10 numbers")
    .max(10, "Phone number must have 10 numbers"),
});

export default function EditProfileForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const user = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: user.Address || "",
      name: user.Name || "",
      phone: user.Phone || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        address: user.Address || "",
        name: user.Name || "",
        phone: user.Phone || "",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof formSchema>) => {
      return UserUsecase.userChangeInformation(payload);
    },
    onSuccess: async (data, payload) => {
      toast.success(data.message);

      dispatch(
        setInfo({
          Name: payload.name,
          Address: payload.address,
          Phone: payload.phone,
        }),
      );
      onSuccess();
    },
    onError: () => {
      toast.error("Cập nhật thất bại. Vui lòng thử lại!");
    },
  });
  function onSubmit(data: z.infer<typeof formSchema>) {
    updateProfileMutation.mutate(data);
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* --- ADDRESS FIELD --- */}
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    {...field} // Đã bao trọn gói value và onChange
                    id="address"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your shipping address"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* --- NAME FIELD --- */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Receiver name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* --- PHONE FIELD --- */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="Receiver phone number"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-rhf-demo">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
