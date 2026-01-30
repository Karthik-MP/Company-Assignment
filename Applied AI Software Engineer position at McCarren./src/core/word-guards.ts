/**
 * Checks whether we can safely use Word JavaScript API features.
 */
export function isWordApiSupported(version: string): boolean {
  try {
    return Office.context.requirements.isSetSupported("WordApi", version);
  } catch {
    return false;
  }
}
