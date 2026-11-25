import { describe, expect, it } from 'vitest';
import { isAbortedFontError } from '../browser/lib/console-errors.js';

const message = (url, text = 'Failed to load resource: net::ERR_FAILED') => ({
  location: () => ({ url }), text: () => text,
});

describe('aborted font console-error exception', () => {
  it.each(['fonts.googleapis.com', 'fonts.gstatic.com'])('allows an aborted resource on %s', (host) => {
    const url = `https://${host}/font`;
    expect(isAbortedFontError(message(url), [url])).toBe(true);
  });
  it('counts a same-origin 404 even if its URL appears in the abort log', () => {
    const url = 'http://127.0.0.1:4173/missing.js';
    expect(isAbortedFontError(message(url, 'Failed to load resource: the server responded with a status of 404'), [url])).toBe(false);
  });
  it('counts font errors unless that exact request was aborted by the route', () => {
    expect(isAbortedFontError(message('https://fonts.googleapis.com/font'), [])).toBe(false);
    expect(isAbortedFontError(message('https://fonts.googleapis.com/font'), ['https://fonts.googleapis.com/other'])).toBe(false);
  });
  it('counts non-resource errors, other hosts, and missing locations', () => {
    const url = 'https://fonts.googleapis.com/font';
    expect(isAbortedFontError(message(url, 'application error'), [url])).toBe(false);
    const other = 'https://fonts.googleapis.com.example/font';
    expect(isAbortedFontError(message(other), [other])).toBe(false);
    expect(isAbortedFontError(message(''), [''])).toBe(false);
  });
});
