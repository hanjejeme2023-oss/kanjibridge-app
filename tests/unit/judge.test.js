import { describe, expect, it } from 'vitest';
import { judge, pyKey, telexSyllable, viKey } from '../../src/app/lib/judge.js';

describe('answer judging', () => {
  it('accepts several Chinese readings and normalizes umlauts', () => {
    expect(judge('hai, huan', 'zh', ['hái', 'huán'], [], true)).toBe('ok');
    expect(judge('hang, xuan', 'zh', ['xíng', 'háng'], [], true)).toBe('ng');
    expect(pyKey('nu:')).toBe(pyKey('nǚ'));
    expect(pyKey('nv')).toBe(pyKey('nǚ'));
  });

  it('accepts Vietnamese without tone marks and Telex', () => {
    expect(judge('hoc', 'vi', ['học'])).toBe('ok');
    expect(judge('tuwj do', 'vi', ['tự do'])).toBe('ok');
    expect(telexSyllable('tuwj')).toBe('tư');
    expect(viKey('học')).toBe('hoc');
  });

  it('handles empty and alternate answers', () => {
    expect(judge('', 'vi', ['học'])).toBeNull();
    expect(judge('tuân', 'vi', ['thuần'], ['tuần'])).toBe('ok');
    expect(judge('a / b', 'zh', ['a', 'b'], [], true)).toBe('ok');
  });
});
