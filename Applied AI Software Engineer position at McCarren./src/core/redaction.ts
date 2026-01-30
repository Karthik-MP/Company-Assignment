export interface RedactionResult {
  summary: string;
  details: string[];
}

export async function redactAndMarkConfidential(
  onProgress?: (msg: string) => void
): Promise<RedactionResult> {
  return Word.run(async (context) => {
    const details: string[] = [];
    const body = context.document.body;

    /* -------------------------------------------------
       1. Enable Track Changes (DEFENSIVE)
    -------------------------------------------------- */
    try {
      if (Office.context.requirements.isSetSupported("WordApi", "1.5")) {
        onProgress?.("Enabling Track Changes…");
        context.document.changeTrackingMode = Word.ChangeTrackingMode.trackAll;
        await context.sync(); // Sync immediately to activate tracking
        details.push("Track Changes enabled.");
      }
    } catch (error) {
      details.push("Track Changes not supported in this environment.");
      console.error("Track Changes error:", error);
    }
    /* -------------------------------------------------
       2. Add CONFIDENTIAL header (DEFENSIVE)
    -------------------------------------------------- */
    try {
      if (Office.context.requirements.isSetSupported("WordApi", "1.5")) {
        onProgress?.("Checking document header…");

        const sections = context.document.sections;
        const section = sections.getFirst();
        const header = section.getHeader("Primary");

        header.load("text");
        await context.sync();

        if (!header.text || !header.text.includes("CONFIDENTIAL DOCUMENT")) {
          onProgress?.("Adding CONFIDENTIAL header…");
          const headerParagraph = header.insertParagraph(
            "CONFIDENTIAL DOCUMENT",
            Word.InsertLocation.start
          );
          // Format the header for better visibility
          headerParagraph.font.bold = true;
          headerParagraph.font.size = 14;
          headerParagraph.alignment = Word.Alignment.centered;

          await context.sync(); // Sync to ensure header is added with tracking
          details.push("Added CONFIDENTIAL DOCUMENT header");
        } else {
          details.push("CONFIDENTIAL DOCUMENT header already exists.");
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      details.push(`Header insertion error: ${errorMsg}`);
    }

    /* -------------------------------------------------
       3. Read document body text (ONLY SAFE API)
    -------------------------------------------------- */
    onProgress?.("Reading document text…");

    body.load("text");
    await context.sync();

    const fullText = body.text ?? "";

    /* -------------------------------------------------
       4. Redaction patterns
    -------------------------------------------------- */
    const patterns: Array<{
      label: string;
      regex: RegExp;
      replacement: string;
    }> = [
      {
        label: "Email",
        regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
        replacement: "[REDACTED EMAIL]",
      },

      // Phone
      {
        label: "Phone",
        regex:
          /\b(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(\s*(?:ext|x|extension)[.\s]*\d+)?\b/gi,
        replacement: "[REDACTED PHONE]",
      },

      // Full SSN
      {
        label: "SSN",
        regex: /\b(?:ssn[:\s#]*)?(\d{3}[- ]?\d{2}[- ]?\d{4})\b/gi,
        replacement: "[REDACTED SSN]",
      },

      // Partial SSN (last 4 digits)
      {
        label: "Partial SSN",
        regex: /\b(?:last (?:4|four)|SSN ending in|xxx-xx-)\d{4}\b/gi,
        replacement: "[REDACTED PARTIAL SSN]",
      },

      // Credit Card Number
      {
        label: "Credit Card",
        regex: /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{4}[- ]?\d{6}[- ]?\d{5}\b/g,
        replacement: "[REDACTED CREDIT CARD]",
      },

      // Date of Birth
      {
        label: "Date of Birth",
        regex:
          /\b(?:DOB|date of birth|birth date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
        replacement: "[REDACTED DOB]",
      },

      // Employee ID
      {
        label: "Employee ID",
        regex: /\bEMP-\d{4}-\d{4}\b/gi,
        replacement: "[REDACTED EMPLOYEE ID]",
      },

      // Medical Record Number
      {
        label: "Medical Record Number",
        regex: /\bMRN-\d+\b/gi,
        replacement: "[REDACTED MRN]",
      },

      // Insurance Policy Number
      {
        label: "Insurance Policy Number",
        regex: /\bINS-\d+\b/gi,
        replacement: "[REDACTED INSURANCE ID]",
      },
    ];

    /* -------------------------------------------------
       5. Redact using SEARCH + REPLACE (SAFE)
    -------------------------------------------------- */
    onProgress?.("Redacting sensitive information…");

    for (const pattern of patterns) {
      const matches = fullText.match(pattern.regex);
      if (!matches) continue;

      for (const match of matches) {
        const ranges = body.search(match, {
          matchCase: false,
          matchWholeWord: false,
        });

        ranges.load("items");
        await context.sync();

        for (const range of ranges.items) {
          range.insertText(pattern.replacement, Word.InsertLocation.replace);
        }
      }

      details.push(`Redacted ${matches.length} ${pattern.label}(s).`);
    }

    await context.sync();

    /* -------------------------------------------------
       6. Final result
    -------------------------------------------------- */
    return {
      summary: "Document successfully redacted and marked confidential.",
      details,
    };
  });
}
