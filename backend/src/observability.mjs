const sensitiveKeys = /key|secret|token|password|authorization|credential/i;

export function createCorrelationId(prefix = "kairos") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sensitiveKeys.test(key) ? "[REDACTED]" : redact(entry)]));
}

export function createTelemetry({ sink = () => {}, clock = () => new Date() } = {}) {
  return Object.freeze({
    emit(event, fields = {}) {
      const record = redact({
        event,
        correlationId: fields.correlationId ?? createCorrelationId(),
        occurredAt: clock().toISOString(),
        ...fields
      });
      sink(Object.freeze(record));
      return record;
    }
  });
}
