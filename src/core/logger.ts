// -----------------------------------------------------------------------------
// Structured logger.
//
// Emits single-line JSON records (request id, duration, status, etc.) so logs
// are trivially ingestible by CloudWatch / Datadog / Loki in production. This
// is the same "structured logging" contract FastAPI services typically expose
// via `structlog` — reimplemented here with zero dependencies.
// -----------------------------------------------------------------------------

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
