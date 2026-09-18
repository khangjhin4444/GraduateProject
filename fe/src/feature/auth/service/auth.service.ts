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
  address?: string;
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
      url: `/api/auth/register`,
      data: {
        username: payload.username,
        password: payload.password,
        fullName: payload.fullName,
        phone: payload.phoneNumber,
        address: payload.address,
      },
      responseSchema: RegisterSchema,
    });
    return response.data as RegisterResponseEntity;
  },
  login: async (payload: LoginPayload) => {
    const response = await publicApi.request({
      method: "POST",
      url: `/api/auth/login`,
      data: {
        username: payload.username,
        password: payload.password,
      },
      responseSchema: LoginSchema,
    });
    return response.data as LoginResponseEntity;
  },
};
