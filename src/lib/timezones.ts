/**
 * IANA time zone identifiers supported by the runtime (e.g. "America/Los_Angeles").
 */
export function listIanaTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // ignore
  }
  return ["UTC"];
}

export function isValidIanaTimeZone(zone: string): boolean {
  const trimmed = zone.trim();
  if (!trimmed) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prefer the session (user_metadata) zone; fall back to the browser-reported
 * `wall_time_zone` hidden field on interaction forms; then UTC.
 */
export function resolvePreferredIanaTimeZone(
  sessionTimeZone: string | null | undefined,
  formData: FormData,
): string {
  const rawSession =
    typeof sessionTimeZone === "string" ? sessionTimeZone.trim() : "";
  if (rawSession && isValidIanaTimeZone(rawSession)) {
    return rawSession;
  }
  const fromForm = String(formData.get("wall_time_zone") ?? "").trim();
  if (fromForm && isValidIanaTimeZone(fromForm)) {
    return fromForm;
  }
  return "UTC";
}
