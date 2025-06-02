export function isFormData(data: unknown): data is FormData {
  return typeof data === "object" && data instanceof FormData;
}
