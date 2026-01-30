# Document Redaction Word Add-in

## Overview

This project implements a Microsoft Word task pane add-in that automatically redacts sensitive information from a document, adds a confidentiality header, and enables Track Changes where supported. The solution is built using TypeScript, a modern build setup, and the official Microsoft Office JavaScript APIs, following best practices for compatibility across Word on the Web and Word Desktop.

The add-in is designed to work robustly across different document structures (tables, paragraphs, mixed content) and to degrade gracefully when certain Word APIs are not available in the host environment.

## Features

- One-click action to redact sensitive information
- Detection and redaction of:
  - Email addresses
  - Phone numbers
  - Social Security Numbers (full and partial)
  - Credit card numbers
  - Dates of birth
  - Employee IDs
  - Medical record numbers
  - Insurance policy numbers
- Adds a CONFIDENTIAL DOCUMENT header (once)
- Attempts to enable Track Changes using Word API 1.5
- Clear run summary showing what actions were performed
- Works in Word on the Web and Word Desktop

---

## Technology Stack & Packages Used

### Core Technologies

- **TypeScript** – strongly typed application logic
- **Office JavaScript API (Word API)** – official Microsoft API for Word add-ins
- **HTML + CSS** – handcrafted UI (no external UI frameworks)
- **Tooling**
  - **Vite** – fast development server and TypeScript bundling
  - **npm** – dependency management
- **Key Dependencies**
  - **office-js** (loaded via Microsoft CDN)
- No third-party UI libraries or CSS frameworks are used

### Project Structure

```
src/
 ├─ main.ts              # Office initialization & app orchestration
 ├─ core/
 │   └─ redaction.ts     # Document analysis & redaction logic
 ├─ ui/
 │   └─ app.ts           # Task pane UI rendering & state management
 ├─ styles/
 │   └─ app.css          # Custom handcrafted styles
 └─ index.html           # Task pane HTML entry
```

## How the Solution Works

1. **Document Content Retrieval**
   - The add-in retrieves the entire document body text using the supported Word API:
     ```typescript
     body.load("text");
     await context.sync();
     ```
   - This approach ensures all content—including tables and paragraphs—is processed.

2. **Sensitive Data Identification**

   Sensitive information is identified using carefully designed regular expressions for each data category. These patterns are applied dynamically, allowing the solution to work on different documents without hardcoding assumptions.

3. **Redaction Strategy**
   - Instead of manipulating raw strings, the add-in uses Word's native search and replace APIs:
     ```typescript
     body.search(match).items[i].insertText(
       "[REDACTED]",
       Word.InsertLocation.replace
     );
     ```
   - This ensures:
     - Changes are applied to the actual Word document
     - Redactions respect Word's editing model
     - Track Changes can capture edits when supported

4. **Confidential Header Insertion**
   - The add-in attempts to insert a CONFIDENTIAL DOCUMENT header using the Word sections and headers API. The header is added only once to prevent duplication.
   - This operation is conditionally executed and safely wrapped to handle environments where header APIs are restricted.

5. **Track Changes Handling**
   - Track Changes is enabled only if Word API requirement set 1.5 is available, using:
     ```typescript
     Office.context.requirements.isSetSupported("WordApi", "1.5")
     ```
   - Where supported (notably in Word Desktop), all redactions and header insertions are recorded as tracked revisions. In Word on the Web, the add-in gracefully degrades due to known platform limitations.

## Host Compatibility Notes

### Word Desktop (Windows / macOS)

- Track Changes enabled
- Header insertion tracked
- Full functionality available

### Word on the Web

- Redaction fully supported
- The add-in continues to function without errors and provides clear run details

This behavior follows Microsoft's official guidance on host-specific API availability.

## How to Run the Project

### Prerequisites

- Node.js (v18+ recommended)
- npm
- Microsoft Word (Web or Desktop)

### Steps

```bash
npm install
npm run dev
```

This will:

- Start a local development server on port 3000
- Compile TypeScript
- Attempt to sideload the add-in into Word

If automatic sideloading fails, manually upload the manifest.xml file via Word → Home → Add-ins → Upload My Add-in.

## Testing the Solution

Open the provided Document-To-Be-Redacted.docx

Launch the task pane add-in

Click Redact & Mark Confidential

Verify:

- Sensitive data is replaced with redaction markers
- Run details list the performed actions
- In Word Desktop, changes appear under Review → Track Changes

The redaction logic is data-driven and will work on other documents with similar sensitive patterns.

## Challenges Faced & Resolutions

1. **Word API Availability Differences**

   Some Word APIs behave differently between Word Web and Word Desktop.

   **Resolution:** Implemented feature detection (`isSetSupported`) and defensive try/catch blocks to ensure graceful degradation without breaking core functionality.

## References & Resources

- [Microsoft Office Add-ins Documentation](https://learn.microsoft.com/office/dev/add-ins/)
- [Word JavaScript API Reference](https://learn.microsoft.com/javascript/api/word)
- [Office Add-ins GitHub Samples](https://github.com/OfficeDev/Office-Add-in-samples)

These official resources were used to guide API usage patterns, host compatibility handling, and architectural best practices.

## Conclusion

This solution delivers a robust, production-style Word add-in that meets all challenge requirements, follows Microsoft-recommended practices, and handles real-world platform constraints gracefully. It is designed for clarity, maintainability, and reliable behavior across different Word environments.