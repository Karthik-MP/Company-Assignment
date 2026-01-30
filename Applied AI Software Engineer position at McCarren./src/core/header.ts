export async function ensureConfidentialHeader(title = "CONFIDENTIAL DOCUMENT"): Promise<boolean> {
  return await Word.run(async (context) => {
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();

    const firstSection = sections.items[0];
    const header = firstSection.getHeader("Primary");
    header.load("text");
    await context.sync();

    if (header.text && header.text.toUpperCase().includes(title)) {
      return false;
    }

    const inserted = header.insertParagraph(title, Word.InsertLocation.start);
    inserted.font.bold = true;
    inserted.font.size = 12;
    inserted.alignment = Word.Alignment.center;
    inserted.spacingAfter = 8;

    await context.sync();
    return true;
  });
}
