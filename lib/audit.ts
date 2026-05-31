import logger from "./logger";

export function auditLog(
  action: string,
  detail: string,
  meta?: Record<string, unknown>
): void {
  logger.info({ action, detail, ...(meta ? { meta } : {}) }, `AUDIT: ${action}`);
}
