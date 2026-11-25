export const resultValue = (value) => (value === 1 || value === 0 ? value : null);

export function cleanTestResults(value, knownKeys = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, row]) => (!knownKeys || knownKeys.has(key)) && row && typeof row === 'object' && !Array.isArray(row))
    .map(([key, row]) => [key, Object.fromEntries(['zh', 'vi']
      .filter((lang) => resultValue(row[lang]) !== null).map((lang) => [lang, row[lang]]))])
    .filter(([, row]) => Object.keys(row).length));
}

export function cleanFFStats(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([, row]) => row && typeof row === 'object' && !Array.isArray(row))
    .map(([key, row]) => [key, {
      miss: Number.isInteger(row.miss) && row.miss >= 0 ? row.miss : 0,
      ok: Number.isInteger(row.ok) && row.ok >= 0 ? row.ok : 0,
    }]));
}
