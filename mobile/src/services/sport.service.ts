import { api } from "@/services/api";
import type { SportDto } from "@/types/sport";

export const getSports = async () => {
  return await api<SportDto[]>("/sports", {
    method: "GET",
    auth: true,
  });
};
