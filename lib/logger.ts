import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.headers.x-api-key",
      "req.headers.x-callback-token",
      "body.password",
      "body.passwordHash",
      "body.token",
      "body.email",
      "body.phone",
      "body.donorEmail",
      "body.donorPhone",
      "body.apiKey",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
