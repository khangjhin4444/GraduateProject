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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import useLogin from "@/hooks/useLogin";
import type { LoginErrorResponse } from "@/feature/auth/schema/auth.schema";
import { useAppDispatch } from "@/state/hooks";
import { setToken } from "@/state/token/tokenSlice";
import { setInfo } from "@/state/profile/profileSlice";

const LoginSchema = z.object({
  username: z.string().min(1, { message: "Please Enter Username" }),
  password: z.string().min(1, { message: "Please Enter Password" }),
});
type LoginForm = z.infer<typeof LoginSchema>;
export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
    reValidateMode: "onSubmit",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginForm) {
    try {
      const response = await loginMutation.mutateAsync(data);
      dispatch(setToken(response.accessToken));
      dispatch(
        setInfo({
          id: response.user.id,
          cartQuantity: Number(response.user.cartQuantity),
          fullName: response.user.Name,
          phoneNumber: response.user.Phone,
          address: response.user.Address,
          role: response.user.role,
        }),
      );
      navigate("/home");
    } catch (error: unknown) {
      if (isAxiosError<LoginErrorResponse>(error)) {
        const errorMessage = error.response?.data.message || error.message;

        form.setError("root", { message: errorMessage });
      } else {
        form.setError("root", { message: "Server Error" });
      }
    }
  }
  return (
    <Card className="w-full md:w-2/3 lg:w-3/4 shadow-2xl py-10 px-5 rounded-[60px]">
      <CardHeader>
        <CardTitle className="text-2xl bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
          Login Account
        </CardTitle>
        <CardDescription>Please enter your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="register-form">
          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="w-full mt-3"
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
                        placeholder="Username"
                      />
                    </div>
                    {fieldState.error && (
                      <p className="text-[12px] text-red-500 font-semibold ml-3 pt-2">
                        {fieldState.error.message}
                      </p>
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password-input">Password</FieldLabel>
                    <div className="px-2">
                      <InputGroup>
                        <InputGroupInput
                          aria-invalid={fieldState.invalid}
                          {...field}
                          id="password-input"
                          type={!showPassword ? "password" : "text"}
                          onChange={(e) => {
                            field.onChange(e);
                            if (fieldState.invalid) {
                              form.clearErrors(field.name);
                            }
                          }}
                          placeholder="Password"
                        />
                        <InputGroupAddon
                          align={"inline-end"}
                          className="cursor-pointer"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {!showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </InputGroupAddon>
                      </InputGroup>
                      {fieldState.error && (
                        <p className="text-[12px] text-red-500 font-semibold ml-1 pt-2">
                          {fieldState.error.message}
                        </p>
                      )}
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
            {!form.formState.isSubmitting ? "Login" : "Logging in..."}
          </Button>
        </Field>
        <div className="flex justify-center items-center gap-2 mt-5">
          <p>Don't have an account?</p>
          <a
            href="/register"
            className="text-blue-500 border-b-2 border-blue-500 font-bold"
          >
            Register Here!
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
