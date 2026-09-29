import { api } from "@/services/api";
import type {
  CopyrightCase,
  ExternalCopyrightScan,
} from "@/types/copyright";

export const getMyCopyrightCases = async () =>
  await api<CopyrightCase[]>("/copyright/cases/me", {
    auth: true,
  });

export const getMyExternalCopyrightScans = async () =>
  await api<ExternalCopyrightScan[]>("/copyright/external-scans/me", {
    auth: true,
  });

export const appealCopyrightCase = async (caseId: string, reason: string) =>
  await api<void>(`/copyright/cases/${caseId}/appeal`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      reason,
    }),
  });
