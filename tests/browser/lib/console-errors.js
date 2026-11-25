// Only resource errors for URLs actually aborted by our route may be exempted.
export function isAbortedFontError(message, aborted) {
  if (!message.text().includes('Failed to load resource')) return false;
  const url = message.location().url;
  if (!aborted.includes(url)) return false;
  try {
    return ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}
