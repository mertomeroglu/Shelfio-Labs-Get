export type ApiBody = {
  message?: string;
  service?: string;
  status: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  mode: "production" | "control-db";
  code?: string;
  message: string;
  data: T;
};
