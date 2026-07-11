import { Mistake, ReviewItem, LevelUpItem } from '@core/models/session.model';
import { I18nService } from './i18n.service';
import {
  localizedProse,
  localizedField,
  localizedExplanation,
  localizedHint,
  localizedTranslation,
  localizedCategory,
  localizedNormalizedCategory,
} from './localized-session.util';

const i18nStub = { t: (key: string) => key } as unknown as I18nService;

function makeMistake(partial: Partial<Mistake>): Mistake {
  return {
    category: partial.category ?? '文法',
    original: partial.original ?? '',
    corrected: partial.corrected ?? '',
    explanation: partial.explanation ?? 'ja-explanation',
    ...partial,
  };
}

function makeReviewItem(partial: Partial<ReviewItem>): ReviewItem {
  return {
    sentence: '',
    answer: '',
    hint: 'ja-hint',
    translation: 'ja-translation',
    choices: [],
    ...partial,
  };
}

function makeLevelUpItem(partial: Partial<LevelUpItem>): LevelUpItem {
  return {
    original: '',
    leveledUp: '',
    keyPhrases: [],
    translation: 'ja-translation',
    ...partial,
  };
}

describe('localizedProse', () => {
  it('lang=jaは常にcorrectedを返す（correctedEnがあっても無視）', () => {
    expect(localizedProse({ corrected: 'ja', correctedEn: 'en' }, 'ja')).toBe('ja');
  });

  it('lang=enかつcorrectedEnありならcorrectedEnを返す', () => {
    expect(localizedProse({ corrected: 'ja', correctedEn: 'en' }, 'en')).toBe('en');
  });

  it('lang=enかつcorrectedEn未定義ならcorrectedにフォールバックする', () => {
    expect(localizedProse({ corrected: 'ja' }, 'en')).toBe('ja');
  });
});

describe('localizedField', () => {
  it('jaがundefinedなら常にundefinedを返す', () => {
    expect(localizedField(undefined, 'en', 'en')).toBeUndefined();
    expect(localizedField(undefined, undefined, 'ja')).toBeUndefined();
  });

  it('lang=enかつenありならenを返す', () => {
    expect(localizedField('ja', 'en', 'en')).toBe('en');
  });

  it('lang=enかつenなしならjaにフォールバックする', () => {
    expect(localizedField('ja', undefined, 'en')).toBe('ja');
  });

  it('lang=jaならenがあってもjaを返す', () => {
    expect(localizedField('ja', 'en', 'ja')).toBe('ja');
  });
});

describe('localizedExplanation / localizedHint / localizedTranslation', () => {
  it('localizedExplanation: ja固定・en優先・enフォールバック', () => {
    const mistake = makeMistake({ explanation: 'ja', explanationEn: 'en' });
    expect(localizedExplanation(mistake, 'ja')).toBe('ja');
    expect(localizedExplanation(mistake, 'en')).toBe('en');
    expect(localizedExplanation(makeMistake({ explanation: 'ja' }), 'en')).toBe('ja');
  });

  it('localizedHint: ja固定・en優先・enフォールバック', () => {
    const item = makeReviewItem({ hint: 'ja', hintEn: 'en' });
    expect(localizedHint(item, 'ja')).toBe('ja');
    expect(localizedHint(item, 'en')).toBe('en');
    expect(localizedHint(makeReviewItem({ hint: 'ja' }), 'en')).toBe('ja');
  });

  it('localizedTranslation: ja固定・en優先・enフォールバック（ReviewItem/LevelUpItem共通）', () => {
    const review = makeReviewItem({ translation: 'ja', translationEn: 'en' });
    expect(localizedTranslation(review, 'ja')).toBe('ja');
    expect(localizedTranslation(review, 'en')).toBe('en');
    expect(localizedTranslation(makeReviewItem({ translation: 'ja' }), 'en')).toBe('ja');

    const levelUp = makeLevelUpItem({ translation: 'ja', translationEn: 'en' });
    expect(localizedTranslation(levelUp, 'en')).toBe('en');
    expect(localizedTranslation(makeLevelUpItem({ translation: 'ja' }), 'en')).toBe('ja');
  });
});

describe('localizedCategory', () => {
  it('categoryKeyがあり辞書に存在する場合、i18n.tの戻り値を返す', () => {
    const mistake = makeMistake({ category: '文法', categoryKey: 'grammar' });
    expect(localizedCategory(mistake, i18nStub)).toBe('mistake.category.grammar');
  });

  it('categoryKeyが未定義の場合、生のcategory文字列を返す', () => {
    const mistake = makeMistake({ category: '旧カテゴリ', categoryKey: undefined });
    expect(localizedCategory(mistake, i18nStub)).toBe('旧カテゴリ');
  });

  it('categoryKeyはあるが辞書に存在しないキーの場合、categoryにフォールバックする', () => {
    const mistake = makeMistake({ category: '未知', categoryKey: 'not-a-real-key' });
    expect(localizedCategory(mistake, i18nStub)).toBe('未知');
  });
});

describe('localizedNormalizedCategory', () => {
  it('辞書内の日本語カテゴリは対応キーでi18n.tの結果を返す', () => {
    expect(localizedNormalizedCategory('文法', i18nStub)).toBe('mistake.category.grammar');
    expect(localizedNormalizedCategory('語順', i18nStub)).toBe('mistake.category.word-order');
  });

  it('辞書に無い文字列はそのまま返す', () => {
    expect(localizedNormalizedCategory('未知のカテゴリ', i18nStub)).toBe('未知のカテゴリ');
  });
});
