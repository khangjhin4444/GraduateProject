import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import TacoImg from "@/assets/taco-bg.webp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useRegister from "@/hooks/useRegister";
import { useNavigate } from "react-router";
import { isAxiosError } from "axios";

const RegisterSchema = z
  .object({
    username: z.string().min(5),
    password: z
      .string()
      .min(8, {
        message: "Password must contains at least 8 characters",
      })
      .refine(
        (val) => {
          return /^(?=.*[A-Z])(?=.*\d)/.test(val);
        },
        {
          message: "Password must contains at least 1 Uppercase and 1 number",
        },
      ),
    confirmPassword: z.string(),
    fullName: z.string().or(z.literal("")),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, {
        message: "Phone number must contains 10 numbers",
      })
      .or(z.literal("")),
    address: z.string().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function Page() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      address: "",
      phoneNumber: "",
    },
  });

  async function onSubmit(data: RegisterForm) {
    try {
      await registerMutation.mutateAsync(data);
      navigate("/login");
    } catch (error: unknown) {
      const message = isAxiosError<{ message?: string }>(error)
        ? (error.response?.data.message ?? error.message)
        : error instanceof Error
          ? error.message
          : "Registration failed";
      form.setError("root", { message });
    }
  }
  return (
    <Card className="w-1/2 shadow-2xl py-15 px-5 rounded-[60px]">
      <CardHeader>
        <CardTitle className="text-2xl bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
          Create account
        </CardTitle>
        <CardDescription>Please enter your details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="register-form">
          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => {
                const hasEnoughLength = field.value.length >= 5 ? true : false;
                return (
                  <Field
                    className="w-full mt-5"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel htmlFor="username-input">
                      Your Username
                    </FieldLabel>
                    <div className="px-2">
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="username-input"
                        placeholder="exampleUsername"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldDescription className="text-[12px] ml-1 pt-2">
                        <span
                          className={cn("font-semibold", {
                            "text-green-500": hasEnoughLength,
                            "text-red-500": fieldState.invalid,
                          })}
                        >
                          At least 5 characters
                        </span>
                      </FieldDescription>
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => {
                const currentValue = field.value || "";
                const hasEnoughLength = currentValue.length >= 8;
                const hasPattern = /^(?=.*[A-Z])(?=.*\d)/.test(currentValue);
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password-input">Password</FieldLabel>
                    <div className="px-2">
                      <Input
                        aria-invalid={fieldState.invalid}
                        {...field}
                        id="password-input"
                        type="password"
                        onChange={(e) => {
                          field.onChange(e);
                          if (fieldState.invalid) {
                            form.clearErrors(field.name);
                          }
                        }}
                        placeholder="Enter your password here"
                      />
                      <FieldDescription className="text-[12px] ml-1 pt-2">
                        <span
                          className={cn("font-semibold", {
                            "text-green-500": hasEnoughLength,
                            "text-red-500": fieldState.invalid,
                          })}
                        >
                          At least 8 characters
                        </span>
                        <br></br>
                        <span
                          className={cn("font-semibold", {
                            "text-green-500": hasPattern,
                            "text-red-500": fieldState.invalid,
                          })}
                        >
                          At least 1 Uppercase letter and 1 number
                        </span>
                      </FieldDescription>
                    </div>
                  </Field>
                );
              }}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirm-password-input">
                    Confirm Password
                  </FieldLabel>
                  <div className="px-2">
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      type="password"
                      id="confirm-password-input"
                      placeholder="Confirm Password"
                      onChange={(e) => {
                        field.onChange(e);
                        if (fieldState.invalid) {
                          form.clearErrors(field.name);
                        }
                      }}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="ml-2" />
                  )}
                </Field>
              )}
            ></Controller>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="full-name-input">
                    Full Name (Optional)
                  </FieldLabel>
                  <div className="px-2">
                    <Input
                      {...field}
                      type="text"
                      id="full-name-input"
                      placeholder="Your Full Name"
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    />
                  </div>
                </Field>
              )}
            ></Controller>
            <Controller
              name="address"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="full-name-input">
                    Address (Optional)
                  </FieldLabel>
                  <div className="px-2">
                    <Input
                      {...field}
                      type="text"
                      id="full-name-input"
                      placeholder="Your Shipping Address"
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    />
                  </div>
                </Field>
              )}
            ></Controller>
            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => {
                const currentValue = field.value || "";
                const hasEnoughLength = currentValue.length === 10;
                const hasPattern = /^\d{10}$/.test(currentValue);
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone-input">
                      Phone Number (Optional)
                    </FieldLabel>
                    <div className="px-2">
                      <Input
                        aria-invalid={fieldState.invalid}
                        {...field}
                        id="phone-input"
                        type="text"
                        onChange={(e) => {
                          field.onChange(e);
                          if (fieldState.invalid) {
                            form.clearErrors(field.name);
                          }
                        }}
                        placeholder="Enter your Phone Number"
                      />
                      <FieldDescription className="text-[12px] ml-1 pt-2">
                        <span
                          className={cn("font-semibold", {
                            "text-green-500": hasPattern && hasEnoughLength,
                            "text-red-500": fieldState.invalid,
                          })}
                        >
                          Has 10 numbers
                        </span>
                      </FieldDescription>
                    </div>
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
        <Field className="mt-8">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            form="register-form"
            className="py-6 rounded-xl bg-linear-to-r from-teal-400 to-blue-500 cursor-pointer"
          >
            {!form.formState.isSubmitting ? "Register" : "Submiting..."}
          </Button>
        </Field>
        <div className="flex justify-center items-center gap-2 mt-5">
          <p>Already have an account?</p>
          <a
            href="/login"
            className="text-blue-500 border-b-2 border-blue-500 font-bold"
          >
            Login Here!
          </a>
        </div>
      </CardContent>
      {form.formState.errors.root && (
        <div className="flex justify-center text-red-500 font-bold">
          {form.formState.errors.root.message}
        </div>
      )}
    </Card>
  );
}
