import { api } from "@/services/api";

export type ReportDto = { id: string; targetType: number; targetId: string; reason: string; description?: string | null; status: number; createdAt: string; reviewedAt?: string | null };

export const createReport = async (targetType: number, targetId: string, reason: string, description?: string) =>
  await api<ReportDto>("/reports", { method: "POST", auth: true, body: JSON.stringify({ targetType, targetId, reason, description: description?.trim() || null }) });

export const getMyReports = async () => await api<ReportDto[]>("/reports/me", { auth: true });
