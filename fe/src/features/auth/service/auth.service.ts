import { publicApi } from "@/api/axios.instance";
import {
  LoginSchema,
  RegisterSchema,
  type LoginResponseEntity,
  type RegisterResponseEntity,
} from "../schema/auth.schema";

export type RegisterPayload = {
  username: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

type Register = (payload: RegisterPayload) => Promise<RegisterResponseEntity>;
type Login = (payload: LoginPayload) => Promise<LoginResponseEntity>;

type AuthService = {
  register: Register;
  login: Login;
};

export const authService: AuthService = {
  register: async (payload: RegisterPayload) => {
    const response = await publicApi.request({
      method: "POST",
      url: `/auth/register`,
      data: {
        username: payload.username,
        password: payload.password,
        fullName: payload.fullName,
        phone: payload.phoneNumber,
      },
      responseSchema: RegisterSchema,
    });
    return response.data as RegisterResponseEntity;
  },
  login: async (payload: LoginPayload) => {
    const response = await publicApi.request({
      method: "POST",
      url: `/auth/login`,
      data: {
        username: payload.username,
        password: payload.password,
      },
      responseSchema: LoginSchema,
      withCredentials: true,
    });
    return response.data as LoginResponseEntity;
  },
};
