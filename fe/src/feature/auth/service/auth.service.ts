import { publicApi } from "@/api/axios.instance";
import {
  RegisterSchema,
  type RegisterResponseEntity,
} from "../schema/auth.schema";

export type RegisterPayload = {
  username: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
};

type Register = (payload: RegisterPayload) => Promise<RegisterResponseEntity>;

type AuthService = {
  register: Register;
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
};
