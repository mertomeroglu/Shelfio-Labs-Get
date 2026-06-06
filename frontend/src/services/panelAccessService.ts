import { apiRequest } from "@/services/apiClient";

export type PanelAccessStartResult = {
  expiresIn: number;
  redirectUrl: string;
};

export async function startPanelAccess(): Promise<PanelAccessStartResult> {
  return apiRequest<PanelAccessStartResult>("/panel-access/start", {
    method: "POST",
  });
}
