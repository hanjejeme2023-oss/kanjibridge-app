export function orderedFFPool(entries, lang, stats) {
  return entries.filter((entry) => entry.traps.includes(lang)).slice().sort((left, right) => {
    const leftRow = stats[`${left.id}:${lang}`];
    const rightRow = stats[`${right.id}:${lang}`];
    const leftMisses = (leftRow || {}).miss || 0;
    const rightMisses = (rightRow || {}).miss || 0;
    return rightMisses - leftMisses || Number(!!leftRow) - Number(!!rightRow) || left.id.localeCompare(right.id);
  });
}

export const newFFRoundIds = (entries, lang, stats) => orderedFFPool(entries, lang, stats).slice(0, 20).map((entry) => entry.id);
export const appendFFMiss = (queue, id) => queue.concat([id]);
export const ffExampleRow = (examples, wordId, lang) => examples.get(`${wordId}:${lang}:ff`) || examples.get(`${wordId}:${lang}:card`) || null;
export const passageChecked = (passage, reads, unknown) => reads.has(passage.id) && !passage.toks.some((token) => token.w && unknown.has(token.w.id));
