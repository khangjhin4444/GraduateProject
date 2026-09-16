import axios, {
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { type ZodSchema } from "zod";
import * as z from "zod";
const BASE_URL = "http://localhost:3001";

declare module "axios" {
  export interface AxiosRequestConfig {
    responseSchema?: ZodSchema;
  }
}

export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const privateApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

privateApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

publicApi.interceptors.response.use((response: AxiosResponse) => {
  const schema = response.config.responseSchema;
  if (schema) {
    const result = schema.safeParse(response.data);
    if (!result.success) {
      console.error(
        `[Zod Error] API: ${response.config.url}`,
        z.prettifyError(result.error),
      );
      return Promise.reject(new Error("Wrong data format from server"));
    }
    response.data = result.data;
    return response;
  }
  return response;
});

privateApi.interceptors.response.use(
  (response: AxiosResponse) => {
    const schema = response.config.responseSchema;
    if (schema) {
      const result = schema.safeParse(response.data);
      if (result.success) {
        response.data = result.data;
        return response;
      } else {
        console.error(
          `[Zod Error] API: ${response.config.url}`,
          z.prettifyError(result.error),
        );
        return Promise.reject(new Error("Wrong data format from server"));
      }
    }
    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        //Token refresh will happen here
      } catch (error) {
        console.error("Session Expired!");
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
