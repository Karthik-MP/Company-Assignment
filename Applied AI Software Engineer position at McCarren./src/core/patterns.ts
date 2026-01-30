export type SensitiveMatchKind = "email" | "phone" | "ssn";

export type SensitiveMatch = {
  kind: SensitiveMatchKind;
  value: string;
};

/**
 * Regex patterns used on the document's plain text.
 *
 * Notes:
 * - We keep these conservative to minimize false positives.
 * - We run replacements in Word using body.search() for each matched literal.
 */
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

// US-style phone numbers with optional country code and separators.
// Examples:
//  - (555) 123-4567
//  - 555-123-4567
//  - 555.123.4567
//  - +1 555 123 4567
const PHONE = /\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// US Social Security Numbers (strict ###-##-####)
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;

export function findSensitiveMatches(text: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];

  const pushAll = (kind: SensitiveMatchKind, re: RegExp) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ kind, value: m[0] });
    }
  };

  pushAll("email", EMAIL);
  pushAll("phone", PHONE);
  pushAll("ssn", SSN);

  return matches;
}

export function defaultRedactionMarker(kind: SensitiveMatchKind): string {
  switch (kind) {
    case "email":
      return "[REDACTED EMAIL]";
    case "phone":
      return "[REDACTED PHONE]";
    case "ssn":
      return "[REDACTED SSN]";
  }
}
