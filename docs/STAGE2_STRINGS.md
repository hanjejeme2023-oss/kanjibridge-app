# Stage 2 UI strings: ja / en / ko draft (for the owner's review)

Claude (architect), 2026-11-26. Companion to `docs/STAGE2_SPEC.md` §7. **Status: ★ decided by the owner on 2026-11-26; the remaining rows are reviewed on the review screenshots at the Stage 2 gate** (PROMPT §5 Stage 2: "Claude drafts en/ko/ja; the owner reviews ja and ko"). Codex copies the values in this file into `src/i18n/en.json`, `ja.json` and `ko.json` without changing a character. Until the Stage 2 gate, this file is the source of truth for the wording. After the gate, the JSON files are.

**The owner's decisions (2026-11-26, HANDOFF "Owner answers"):**
- Every row marked ★ is decided. Rows marked "★ decided 2026-11-26" were changed from the draft or confirmed. The changed keys are listed in §5.
- Content (meanings, examples, notes) stays Japanese (D1). The owner confirmed that it does not need translating now.
- **Every other row** is checked by the owner at the Stage 2 gate, on the en and ko review screenshots (`docs/STAGE2_SPEC.md` §8.4, §11 item 14). That check is how "the owner has approved the wording" is met. A change found there goes into this file and the JSON files in the same commit.

**How to review (owner), at the gate:** read §1 (terms) first. Then go down §3 one block at a time, next to the screenshots. If you change a value, edit the cell directly, or write the new text in the "memo" column, starting with **"Owner:"**. Nothing in the ja column changes for the 114 keys that already exist, unless you change it. Their values are copied from `src/i18n/ja.json`.

**Notation** (for invisible characters only):
- `⎵` = a significant ASCII space at the start or end of a value (U+0020). Codex writes a real space.
- `〔U+3000〕` = a value that is just one ideographic space.
- Other ideographic spaces inside ja values (`　`) are real U+3000 characters, exactly as in `ja.json`.
- `{name}` = a value inserted by the app (a number, a reading, a word). Keep every `{name}` of a row in every language. You may move it inside the sentence.

## 1. Terms and style (read this first)

### 1.1 Glossary

| ja | en | ko | Memo |
|---|---|---|---|
| 漢字ブリッジ | Kanji Bridge | Kanji Bridge | ★ decided 2026-11-26: App name. ja stays 漢字ブリッジ. en and ko use "Kanji Bridge" in Latin letters; ko does not write it in Hangul. Every ko key that names the app uses it (§5). |
| 漢 (logo mark) | 漢 | 漢 | The logo keeps the character 漢 in every language. The logo then reads "漢 Bridge" in en and ko, like "漢 ブリッジ". |
| カード | cards | 카드 | |
| 音のルール | sound rules | 발음 규칙 | ★ decided 2026-11-26 (as drafted) |
| 偽の友達 | false friends | 거짓 짝 | ★ decided 2026-11-26: en is the usual linguistics term; ko 거짓 짝 |
| 読解 | reading | 독해 | |
| 字体 | glyphs | 글자형 | ★ decided 2026-11-26: en "Glyphs", ko 글자형 (the view name) |
| 読み (of a word) | reading | 발음 | ko 읽기 would mean the activity "reading" |
| パッチム | batchim | 받침 | en learners of Korean use "batchim" |
| 声調 / 1声 … 4声 / 軽声 | tone / 1st tone … 4th tone / neutral tone | 성조 / 1성 … 4성 / 경성 | |
| 習得 | learned | 습득 | |
| 繁体 / 簡体 | Traditional / Simplified | 번체 / 간체 | |
| 日・韓・中・越 (short labels) | JP · KR · CN · VN | 일 · 한 · 중 · 베 | ★ decided 2026-11-26 (as drafted). en uses country-style codes, which are more familiar than ISO ZH/VI. Used in the false-friend rows and the passage names ("VN 1", "베 1") |
| 例外 | exception | 예외 | |
| 文語 | literary | 문어 | |
| 使われ方 | usage | 쓰임 | |
| 一覧 | list | 목록 | |
| テスト / クイズ | test / quiz | 테스트 / 퀴즈 | |
| もう一回 / 難しい / OK / 簡単 | Again / Hard / Good / Easy | 다시 / 어려움 / 좋음 / 쉬움 | ★ decided 2026-11-26 (as drafted). en follows Anki's wording |
| 学習記録 | progress | 학습 기록 | |
| リセット | reset | 초기화 | |
| 再生 | play | 재생 | |
| わからない | didn't know | 모르는 단어 | |

### 1.2 Style rules

- **en:** sentence case ("Show answer", not "Show Answer"). No full stop on labels and buttons; full stops on whole sentences. British spelling ("licence"), matching the EDRDG sentence, which must stay word for word.
- **ko:** 해요체 for whole sentences (messages, hints). Short noun phrases for labels and buttons. ASCII punctuation: `( ) : ,`. The middle dot `·` joins items, as in 일본어·한국어.
- **en and ko punctuation:** where ja uses Japanese typography (`　` gaps, `・`, `（）`, `：`, `…`), en and ko use ` · `, `( )`, `: ` and `…`. Neither en nor ko uses U+3000. (Open note 6.)
- **No plural forms needed in en.** Every count is written so that it reads well for 1 and for many ("{n} left", "{n}d"). The app has no plural machinery, and the spec does not add one.
- **Particles in ko** after an inserted `{name}` were checked for every value the app can insert:
  - `{lang}` is always 중국어 or 베트남어, so 를 and 로 are right;
  - `{kr}` is a jamo whose name ends in a consonant (기역, 비읍, 리을, 니은, 미음, 이응);
  - no particle follows `{vi}`.
- **Content stays Japanese (D1).** Meanings, example translations, word notes, character notes and the rules' `jp`/`zh` explanations come from `data.js`. They stay Japanese in every UI language. The one-line notice (`notice.content_ja`) says so.

### 1.3 Open note 6 (translation notes from Stage 0), applied

| Note | What the draft does |
|---|---|
| `speech.no_voice` names Windows menu items | en uses the Windows 11 English names: **Settings → Time & language → Language & region**. ko uses the Korean names: **설정 → 시간 및 언어 → 언어 및 지역**. ★ decided 2026-11-26 (as drafted): the owner cannot check a Korean Windows 11, so the ko names stay as drafted. |
| `about.licence_before/after` split a sentence around the link | Both halves are non-empty in every language (the app needs that). en: "… Details: ⎵[link]." ko: "… 자세한 내용은⎵[link]에서 볼 수 있어요." |
| `tone.separator` and the `　` gaps are Japanese typography | en uses ` · `, ko uses `·` (2성·4성). The other gaps use ` · `. |

## 2. What changes in the key list

- **114 existing app keys:** unchanged keys and ja values. en and ko are new.
- **Removed:** `overview.open_app` (the Stage 1 placeholder link "アプリを開く"). The real overview page uses `overview.start`.
- **New: 16 keys.**
  - `meta.native_name`, `meta.html_lang`, `meta.number_locale`: locale settings, one value per language. They are not translated text (STAGE2_SPEC §4.1).
  - `header.lang_label` and `notice.content_ja`: in the app.
  - 11 `overview.*` keys: the overview page.
- **Total: 130 keys** in each of `en.json`, `ja.json` and `ko.json`.

## 3. All keys

### 3.0 Locale settings (new; not shown as text)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `meta.native_name` | 日本語 | English | 한국어 | Shown in the language switch in its own language, in every UI language |
| `meta.html_lang` | ja | en | ko | `<html lang>` |
| `meta.number_locale` | ja-JP | en-US | ko-KR | tab counts (4,051 in all three) |

### 3.1 Document and header

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `app.title` | 漢字ブリッジ | Kanji Bridge | Kanji Bridge | ★ decided 2026-11-26: app name (§1.1) |
| `header.logo_mark` | 漢 | 漢 | 漢 | same in every language |
| `header.logo_text` | ブリッジ | Bridge | Bridge | after the mark and one space. ★ decided 2026-11-26: en and ko are the same (app name, §1.1) |
| `nav.cards` | カード | Cards | 카드 | |
| `nav.rules` | 音のルール | Sound rules | 발음 규칙 | ★ decided 2026-11-26 (as drafted) |
| `nav.ff` | 偽の友達 | False friends | 거짓 짝 | ★ decided 2026-11-26 |
| `nav.read` | 読解 | Reading | 독해 | |
| `nav.glyph` | 字体 | Glyphs | 글자형 | ★ decided 2026-11-26 |
| `header.mute` | ミュート | Mute | 음소거 | |
| `header.topstat` | 今日 {due} 枚　習得 {learned}/{total} | Today {due} · Learned {learned}/{total} | 오늘 {due}장 · 습득 {learned}/{total} | hidden below 760 px width |
| `header.lang_label` | 表示言語 | Language | 표시 언어 | **new.** Screen-reader name of the language switch (not visible) |

### 3.2 Language names

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `lang.ja` | 日本語 | Japanese | 일본어 | |
| `lang.ko` | 韓国語 | Korean | 한국어 | |
| `lang.zh` | 中国語 | Chinese | 중국어 | also inserted as `{lang}` in the speech messages |
| `lang.vi` | ベトナム語 | Vietnamese | 베트남어 | as above |
| `lang.zh_pinyin` | 中国語（ピンイン） | Chinese (pinyin) | 중국어(병음) | card input label |
| `lang.both` | 両方 | Both | 둘 다 | |
| `lang.short_ja` | 日 | JP | 일 | ★ decided 2026-11-26 (as drafted): short labels (§1.1) |
| `lang.short_ko` | 韓 | KR | 한 | |
| `lang.short_zh` | 中 | CN | 중 | |
| `lang.short_vi` | 越 | VN | 베 | |

### 3.3 View explanations

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `cards.explain` | 2字以上の単語を、日本語と韓国語を手がかりに中国語・ベトナム語で答える | Words of two or more characters: answer in Chinese and Vietnamese, with Japanese and Korean as clues | 두 글자 이상의 단어를 일본어와 한국어를 단서로 중국어·베트남어로 답해요 | also the overview caption |
| `rules.explain` | 韓国語のパッチムからベトナム語の語末を推測するルール | Rules for guessing the Vietnamese final sound from the Korean batchim | 한국어 받침으로 베트남어의 끝소리를 추측하는 규칙 | also the overview caption |
| `ff.explain` | 同じ漢字でも言語によって意味が違う、間違えやすい単語 | Words written with the same kanji but with different meanings, so they are easy to get wrong | 같은 한자라도 언어마다 뜻이 달라 헷갈리기 쉬운 단어 | also the overview caption |
| `read.explain` | 短い中国語・ベトナム語の文を読み、わからない語をタップして確認する | Read short Chinese and Vietnamese texts, and tap a word you don't know to look it up | 짧은 중국어·베트남어 글을 읽고, 모르는 단어를 눌러 확인해요 | also the overview caption |
| `glyph.explain` | 1字の漢字の形（日本・繁体・簡体）と読み、使われ方 | Single kanji: their forms (Japanese, Traditional, Simplified), readings and usage | 한 글자 한자의 모양(일본·번체·간체)과 발음, 쓰임 | also the overview caption |

### 3.4 Shared

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `common.all` | すべて | All | 전체 | |
| `common.list` | 一覧 | List | 목록 | |
| `common.correct` | 正解 | Correct | 정답 | |
| `word.rare_reading` | （{r}） | ({r}) | ({r}) | a rarely used ja/ko reading, in brackets |

### 3.5 カード (cards)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `cards.autoplay` | 答えを自動で再生 | Play the answer automatically | 정답 자동 재생 | toggle |
| `cards.queue` | 残り {n} 枚 | {n} left | 남은 카드 {n}장 | |
| `cards.done_title` | 今日はここまで | That's all for today | 오늘은 여기까지 | |
| `cards.done_text` | 読解で新しい単語を見つけて、カードに追加できる。 | You can find new words in Reading and add them to your cards. | 독해에서 새 단어를 찾아 카드에 추가할 수 있어요. | |
| `cards.korean_hanja` | 韓国の漢字 {h} | Korean hanja {h} | 한국 한자 {h} | only when the Korean form differs |
| `cards.guess_placeholder` | 読みを予想 | Guess the reading | 발음을 맞혀 보세요 | input placeholder |
| `cards.show_answer` | 答えを見る | Show answer | 정답 보기 | followed by the key cap `Enter` |
| `cards.no_tone_ok` | 声調記号なしで入力してもOK | You can type without tone marks | 성조 기호 없이 입력해도 돼요 | |
| `cards.no_input` | 入力なし | No answer | 입력 없음 | |
| `cards.yours` | あなた：{s} | You: {s} | 내 답: {s} | |
| `cards.glyph_tag` | 字体　{j}　{h}　{z} | Forms {j} · {h} · {z} | 글자형 {j} · {h} · {z} | the three forms, when they differ. ko follows the view name 글자형 (2026-11-26) |
| `cards.rate_again` | もう一回 | Again | 다시 | ★ decided 2026-11-26 (as drafted; §1.1) |
| `cards.rate_hard` | 難しい | Hard | 어려움 | |
| `cards.rate_ok` | OK | Good | 좋음 | ★ decided 2026-11-26 (as drafted) |
| `cards.rate_easy` | 簡単 | Easy | 쉬움 | |
| `cards.interval_now` | すぐ | soon | 곧 | small text under "Again" |
| `cards.interval_days` | {n}日後 | {n}d | {n}일 후 | en is Anki-style ("3d"); no plural needed |
| `cards.play_vi` | ベトナム語を再生 | Play Vietnamese | 베트남어 재생 | after the key cap `V` |
| `cards.play_zh` | 中国語を再生 | Play Chinese | 중국어 재생 | after the key cap `C` |
| `cards.play_sep` | 〔U+3000〕 | ⎵·⎵ | ⎵·⎵ | joins the two play hints |

### 3.6 音のルール (sound rules)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `rules.none_label` | パッチムなし → 子音で終わらない | No batchim → no final consonant | 받침 없음 → 자음으로 끝나지 않음 | the other five rule labels ("ㄱ → -c / -ch") come from data and need no translation |
| `rules.tag` | {ko} → {vi}　{label} | {ko} → {vi} · {label} | {ko} → {vi} · {label} | tag on cards and in 読解 |
| `rules.exception` | 例外 | exception | 예외 | |
| `rules.heading` | パッチム {kr} は {vi} になる | Batchim {kr} becomes {vi} in Vietnamese | 받침 {kr} → 베트남어 {vi} | ko avoids a particle after {vi} (§1.2) |
| `rules.compare` | 日本語では{jp}。中国語では{zh}。 | Japanese: {jp} / Chinese: {zh} | 일본어: {jp} / 중국어: {zh} | {jp} and {zh} are Japanese texts from data (e.g. "く・き で終わる（がく・こく・れき）"), so en/ko use a label form, not a sentence around them |
| `rules.answer_line` | ベトナム語 {vi}　　中国語 {zh} | Vietnamese {vi} · Chinese {zh} | 베트남어 {vi} · 중국어 {zh} | {vi} and {zh} include a speaker button |
| `rules.next` | 次へ | Next | 다음 | followed by the key cap `Enter` |
| `rules.question` | ベトナム語の読みはどれ？ | Which is the Vietnamese reading? | 베트남어 발음은 어느 것일까요? | |
| `rules.test_start` | テストする | Test yourself | 테스트하기 | |
| `rules.test_stop` | テストをやめる | Stop the test | 테스트 그만하기 | |
| `rules.show_examples` | このルールの例をすべて見る | Show all examples of this rule | 이 규칙의 예 모두 보기 | |
| `rules.col_han` | 漢字 | Kanji | 한자 | table header |

### 3.7 Tones

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `tone.zh_1` | 1声 | 1st tone | 1성 | |
| `tone.zh_2` | 2声 | 2nd tone | 2성 | |
| `tone.zh_3` | 3声 | 3rd tone | 3성 | |
| `tone.zh_4` | 4声 | 4th tone | 4성 | |
| `tone.zh_5` | 軽声 | neutral tone | 경성 | |
| `tone.separator` | ・ | ⎵·⎵ | · | between syllables: "2nd tone · 4th tone", "2성·4성". The Vietnamese tone names (sắc, huyền …) stay as they are in every language |

### 3.8 Speech

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `speech.unsupported` | このブラウザは読み上げに対応していない。EdgeかChromeで開いてみて。 | This browser can't read text aloud. Try opening the page in Edge or Chrome. | 이 브라우저는 소리 내어 읽기를 지원하지 않아요. Edge나 Chrome에서 열어 보세요. | |
| `speech.no_voice` | このPCに{lang}の音声が見つからない。Windowsの「設定 → 時刻と言語 → 言語と地域」で{lang}を追加して音声をインストールするか、Microsoft Edgeで開いてみて。 | No {lang} voice was found on this PC. In Windows, go to Settings → Time & language → Language & region, add {lang} and install its voice, or try opening the page in Microsoft Edge. | 이 PC에서 {lang} 음성을 찾을 수 없어요. Windows의 '설정 → 시간 및 언어 → 언어 및 지역'에서 {lang}를 추가하고 음성을 설치하거나, Microsoft Edge에서 열어 보세요. | ★ decided 2026-11-26 (as drafted): Windows menu names (§1.3) |
| `speech.failed` | 読み上げに失敗した。もう一度押してみて。 | Couldn't read it aloud. Please press the button again. | 소리 내어 읽기에 실패했어요. 다시 눌러 보세요. | |
| `speech.play_in` | {lang}で再生 | Play in {lang} | {lang}로 재생 | button label for screen readers, and tooltip |

### 3.9 偽の友達 (false friends)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `ff.mode_cards` | フラッシュカード | Flashcards | 플래시카드 | |
| `ff.help` | タップすると本当の意味 | Tap to see the real meaning | 누르면 진짜 뜻이 보여요 | |
| `ff.hint` | 実は… | Actually… | 사실은… | |
| `ff.reading_paren` | （{r}） | ({r}) | ({r}) | a reading in brackets after a meaning |
| `ff.empty` | 該当する単語はない | No matching words | 해당하는 단어가 없어요 | |
| `ff.rate_miss` | まだ | Not yet | 아직 | followed by the key cap `1` |
| `ff.rate_ok` | わかった | Got it | 알았어요 | followed by the key cap `2` |

### 3.10 読解 (reading)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `read.show_annotations` | 読みを表示 | Show readings | 힌트 표시 | ★ decided 2026-11-26: ko 힌트 표시 (the draft was 주석 표시). Under Vietnamese texts the app shows the hanja, not a pronunciation, so ko avoids 발음 |
| `read.passage_name` | {lang} {n} | {lang} {n} | {lang} {n} | {lang} = the short label: "VN 1", "베 1" |
| `read.annotation` | {ja}　{ko} | {ja} · {ko} | {ja} · {ko} | the Japanese and Korean readings under a Chinese word |
| `read.checked` | ⎵✓ | ⎵✓ | ⎵✓ | the same in every language |
| `read.unknown` | わからない | Words you didn't know | 모르는 단어 | heading of the review list |
| `read.tap_hint` | 下線の単語をタップすると、4つの言語の対応が出る | Tap an underlined word to see it in all four languages | 밑줄 친 단어를 누르면 네 언어의 대응이 나와요 | |
| `read.add_card` | カードに追加 | Add to cards | 카드에 추가 | |
| `read.added` | カードに追加済み | Added to cards | 카드에 추가됨 | |

### 3.11 字体 (glyphs)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `glyph.mode_quiz` | クイズ | Quiz | 퀴즈 | |
| `glyph.filter_diff` | 3つとも違う | All three differ | 셋 다 다름 | |
| `glyph.filter_jz` | 日本＝中国 | JP = CN | 일본 = 중국 | |
| `glyph.filter_jk` | 日本＝韓国 | JP = KR | 일본 = 한국 | |
| `glyph.filter_level` | レベル{n} | Level {n} | 레벨 {n} | n = 1 … 7 |
| `glyph.filter_wrong` | 間違えた字だけ | Wrong answers only | 틀린 글자만 | |
| `glyph.score` | {ok} / {answered} 正解 | {ok} / {answered} correct | {answered}개 중 {ok}개 정답 | |
| `glyph.ff_badge` | 偽の友達 | False friend | 거짓 짝 | badge on one word (en singular). ko follows the view name 거짓 짝 (2026-11-26) |
| `glyph.no_examples` | 例なし | No examples | 예 없음 | |
| `glyph.literary` | 文語 | literary | 문어 | tag |
| `glyph.usage` | 使われ方 | Usage | 쓰임 | |
| `glyph.col_jp` | 日本 | Japan | 일본 | column header |
| `glyph.col_kr` | 韓国・繁体 | Korea · Traditional | 한국·번체 | |
| `glyph.col_cn` | 中国・簡体 | China · Simplified | 중국·간체 | |
| `glyph.col_reading` | 読み | Reading | 발음 | |
| `glyph.empty` | 該当する字はない | No matching characters | 해당하는 글자가 없어요 | |

### 3.12 Footer and About

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `footer.storage_note` | 学習記録はこのブラウザにだけ保存されます。 | Your progress is saved only in this browser. | 학습 기록은 이 브라우저에만 저장돼요. | changes with sync in Stage 3 (Open note 3) |
| `footer.about` | このアプリについて | About this app | 이 앱에 대해 | button, panel name and heading |
| `footer.reset` | 記録をリセット | Reset progress | 기록 초기화 | |
| `footer.reset_confirm` | もう一度押すとリセット | Press again to reset | 한 번 더 누르면 초기화돼요 | shown for 3 s |
| `about.intro` | 漢字ブリッジは、日本語と韓国語を知っている人が中国語とベトナム語を学ぶための個人の非営利の学習ツール。 | Kanji Bridge is a personal, non-commercial study tool for people who know Japanese and Korean and want to learn Chinese and Vietnamese. | Kanji Bridge는 일본어와 한국어를 아는 사람이 중국어와 베트남어를 배우기 위한 개인 비영리 학습 도구예요. | contains the app name (§1.1; ko changed 2026-11-26) |
| `about.data_label` | データ | Data | 데이터 | bold |
| `about.data_sources` | ：Unihan（Unicode, Inc.）、KANJIDIC2・JMdict（EDRDG、CC BY-SA 4.0）、CC-CEDICT（MDBG、CC BY-SA 4.0）、Wiktionary（Kaikki/Wiktextract 経由、CC BY-SA 4.0）、FrequencyWords（OpenSubtitles 2018、CC BY-SA 4.0）、libhangul hanja.txt（BSD-3-Clause）、ivankra/hsk30（MIT）、OpenCC（Apache 2.0）。 | : Unihan (Unicode, Inc.), KANJIDIC2 and JMdict (EDRDG, CC BY-SA 4.0), CC-CEDICT (MDBG, CC BY-SA 4.0), Wiktionary (via Kaikki/Wiktextract, CC BY-SA 4.0), FrequencyWords (OpenSubtitles 2018, CC BY-SA 4.0), libhangul hanja.txt (BSD-3-Clause), ivankra/hsk30 (MIT), OpenCC (Apache 2.0). | : Unihan(Unicode, Inc.), KANJIDIC2·JMdict(EDRDG, CC BY-SA 4.0), CC-CEDICT(MDBG, CC BY-SA 4.0), Wiktionary(Kaikki/Wiktextract 경유, CC BY-SA 4.0), FrequencyWords(OpenSubtitles 2018, CC BY-SA 4.0), libhangul hanja.txt(BSD-3-Clause), ivankra/hsk30(MIT), OpenCC(Apache 2.0). | attribution: every source, owner and licence name stays exactly as in ja. Starts with ": " because it follows the bold label |
| `about.edrdg` | This app uses the JMdict and KANJIDIC2 dictionary files. These files are the property of the Electronic Dictionary Research and Development Group, and are used in conformance with the Group's licence. | *(identical)* | *(identical)* | **licence wording: identical in every language.** A test enforces it |
| `about.licence_before` | データは CC BY-SA 4.0、プログラムは MIT ライセンスで公開している。詳しくは | The data is published under CC BY-SA 4.0 and the program under the MIT licence. Details:⎵ | 데이터는 CC BY-SA 4.0, 프로그램은 MIT 라이선스로 공개하고 있어요. 자세한 내용은⎵ | text before the repository link (Open note 6) |
| `about.licence_after` | 。 | . | 에서 볼 수 있어요. | text after the link; never empty |
| `about.ai_note` | 例文と一部の意味は AI（Google Gemini）が作ったもので、誤りを含むことがある。 | The example sentences and some meanings were written by AI (Google Gemini) and may contain mistakes. | 예문과 일부 뜻은 AI(Google Gemini)가 만든 것이라 틀린 내용이 있을 수 있어요. | required notice (PROMPT §2): keep "AI" and "Google Gemini" |
| `about.privacy` | データは集めていない。学習の記録はこのブラウザの中だけに保存される。 | No data is collected. Your progress is saved only in this browser. | 데이터는 수집하지 않아요. 학습 기록은 이 브라우저 안에만 저장돼요. | changes with sync in Stage 3 (Open note 3) |

### 3.13 Content notice (new)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `notice.content_ja` | このバージョンでは、意味・例文の訳・解説は日本語で表示される。 | In this version, meanings, example translations and notes are in Japanese. | 이 버전에서는 뜻, 예문 번역, 해설이 일본어로 나와요. | **new.** One line in the app and on the overview page. Under proposal P11 it is shown only in en and ko; the ja value exists for completeness. "Notes" covers the word notes, character notes and rule explanations, which are also Japanese |

### 3.14 Overview page (new)

| Key | ja | en | ko | Memo |
|---|---|---|---|---|
| `overview.page_title` | 漢字ブリッジ：知っている漢字から中国語とベトナム語へ | Kanji Bridge: from the kanji you know to Chinese and Vietnamese | Kanji Bridge: 아는 한자로 중국어와 베트남어까지 | `<title>` and search result title. Contains the app name (§1.1; ko changed 2026-11-26) |
| `overview.meta_description` | 日本語と韓国語を知っている人のための、中国語とベトナム語の無料の学習アプリ。単語カード、音のルール、偽の友達、読解、字体の5つの画面。 | A free app for people who know Japanese and Korean and want to learn Chinese and Vietnamese: word cards, sound rules, false friends, reading and glyphs. | 일본어와 한국어를 아는 사람을 위한 무료 중국어·베트남어 학습 앱. 단어 카드, 발음 규칙, 거짓 짝, 독해, 글자형의 다섯 화면. | search result text; not shown on the page. Uses the view names (§1.1; en and ko changed 2026-11-26) |
| `overview.lead` | 日本語と韓国語で知っている漢字の読みと意味を手がかりに、中国語とベトナム語の単語を覚えるアプリ。 | Learn Chinese and Vietnamese words through the kanji readings and meanings you already know from Japanese and Korean. | 일본어와 한국어로 이미 아는 한자의 발음과 뜻을 단서로 중국어와 베트남어 단어를 익히는 앱이에요. | first sentence under the title |
| `overview.free` | 無料。登録は不要で、学習の記録はこのブラウザに保存される。 | Free, with no sign-up. Your progress is saved in this browser. | 무료이고 가입할 필요가 없어요. 학습 기록은 이 브라우저에 저장돼요. | stays true in Stage 3: sign-in will be optional |
| `overview.start` | はじめる | Start | 시작하기 | the main button; opens the app in this page's language |
| `overview.views_heading` | 5つの画面 | Five views | 다섯 가지 화면 | |
| `overview.shot_alt` | 「{view}」の画面 | Screenshot of {view} | {view} 화면 | image text for screen readers; {view} = the view name (`nav.*`) |
| `overview.sources_heading` | データとライセンス | Data and licences | 데이터와 라이선스 | |
| `overview.notices` | 帰属表示とライセンスの全文： | Full attribution and licence texts: | 출처 표시와 라이선스 전문: | followed by the links NOTICE.md · LICENSE-DATA · DATA-LICENSE.md (file names, not translated) |
| `overview.privacy_heading` | プライバシー | Privacy | 개인정보 | |
| `overview.privacy_text` | アカウントはなく、アクセス解析もしていない。学習の記録はこのブラウザの中だけに保存される。アプリはフォントを Google Fonts から読み込む。読み上げにはブラウザの音声を使い、オンラインの音声の場合は読み上げる語がその提供元（Microsoft や Google など）に送られる。 | There are no accounts and no tracking. Your progress is saved only in this browser. The app loads its fonts from Google Fonts. Read-aloud uses your browser's voices; online voices send the spoken word to their provider (for example Microsoft or Google). | 계정도 없고 방문 분석도 하지 않아요. 학습 기록은 이 브라우저 안에만 저장돼요. 앱은 Google Fonts에서 글꼴을 불러와요. 소리 내어 읽기에는 브라우저의 음성을 사용하며, 온라인 음성이면 읽는 단어가 제공업체(Microsoft, Google 등)로 전송돼요. | ★ decided 2026-11-26 (as drafted; the owner agrees to publish it). New, and more precise than About's sentence: it names the two third parties that STAGE1_INVENTORY §4 found. Stage 3 and 4 will replace it |

**Reused on the overview page** (no new key): `app.title`, `header.logo_mark`, `header.logo_text`, `header.lang_label` (name of the language links), `meta.native_name` (text of the language links), the five `nav.*` names with their `*.explain` lines (captions), `about.data_label`, `about.data_sources`, `about.edrdg`, `about.ai_note`, `about.licence_before` / `about.licence_after` (around a link to `github.com/hanjejeme2023-oss/kanjibridge-app`), and `notice.content_ja` (en and ko pages only).

## 4. Key count check

| Group | Keys |
|---|---|
| 3.0 locale settings | 3 |
| 3.1 document and header | 11 (10 existing + `header.lang_label`) |
| 3.2 language names | 10 |
| 3.3 explanations | 5 |
| 3.4 shared | 4 |
| 3.5 cards | 20 |
| 3.6 rules | 12 |
| 3.7 tones | 6 |
| 3.8 speech | 4 |
| 3.9 false friends | 7 |
| 3.10 reading | 8 |
| 3.11 characters | 16 |
| 3.12 footer and About | 12 |
| 3.13 notice | 1 |
| 3.14 overview | 11 |
| **Total** | **130**: 114 existing app keys + 16 new |

Claude checked this table with a script on 2026-11-26: 130 rows, 130 unique keys; the only `ja.json` key that is missing is `overview.open_app` (removed on purpose); and every ja cell of the 114 existing keys equals `src/i18n/ja.json` character for character (reading `⎵` as a space and `〔U+3000〕` as U+3000). The gate repeats this comparison against the three JSON files.

## 5. Changes from the draft (owner's ★ decisions, 2026-11-26)

Recorded by Claude from the owner's answers (HANDOFF "Owner answers", 2026-11-26). No ja value changed. **10 keys, 12 cells:**

| Key | Column | Draft | Now | Why |
|---|---|---|---|---|
| `app.title` | ko | 한자 브리지 | Kanji Bridge | app name: "Kanji Bridge" in en and ko, not in Hangul |
| `header.logo_text` | ko | 브리지 | Bridge | app name (the header logo) |
| `about.intro` | ko | 한자 브리지는 … | Kanji Bridge는 … | app name (About) |
| `overview.page_title` | ko | 한자 브리지: … | Kanji Bridge: … | app name (overview `<title>`) |
| `nav.ff` | ko | 가짜 친구 | 거짓 짝 | false friends = 거짓 짝 |
| `glyph.ff_badge` | ko | 가짜 친구 | 거짓 짝 | as above |
| `nav.glyph` | en | Characters | Glyphs | 字体 = Glyphs / 글자형 |
| `nav.glyph` | ko | 자형 | 글자형 | as above |
| `cards.glyph_tag` | ko | 자형 {j} · {h} · {z} | 글자형 {j} · {h} · {z} | as above |
| `overview.meta_description` | en | … reading and characters. | … reading and glyphs. | view name |
| `overview.meta_description` | ko | … 가짜 친구, 독해, 자형의 다섯 화면. | … 거짓 짝, 독해, 글자형의 다섯 화면. | view names |
| `read.show_annotations` | ko | 주석 표시 | 힌트 표시 | the owner's answer to Claude's question about this ★ row |

The glossary (§1.1) uses the same words. Confirmed as drafted: 발음 규칙 / Sound rules, the short labels (JP/KR/CN/VN, 일/한/중/베), the rating words (Again/Hard/Good/Easy, 다시/어려움/좋음/쉬움), the Windows menu names in `speech.no_voice` (ko not checked on a Korean Windows), and `overview.privacy_text` (may be published).

Not changed, because no decision covers them: en `cards.glyph_tag` keeps "Forms" (it does not use the view name), and en `glyph.empty` keeps "No matching characters" (it means kanji, not the view). The owner can change either at the gate.

After these changes, in §1–§3: no ko cell contains 한자 브리지, 브리지, 가짜 친구, 자형 (except inside 글자형) or 주석, and no en cell uses "Characters" as the view name.
