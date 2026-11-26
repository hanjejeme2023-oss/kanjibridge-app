import { describe, expect, it } from 'vitest';
import { markedTone, toneHint } from '../../src/app/lib/tone.js';

describe('tone hints', () => {
  it('names Chinese tones', () => {
    expect(markedTone('xué', 'zh')).toBe('2声');
    expect(markedTone('de', 'zh')).toBe('軽声');
    expect(toneHint('zh', ['xue'], '2')).toBe('2声');
  });

  it('names Vietnamese tones', () => {
    expect(markedTone('học', 'vi')).toBe('nặng');
    expect(markedTone('hoc', 'vi')).toBe('ngang');
    expect(toneHint('vi', ['học viên'])).toBe('nặng・ngang');
  });
});
