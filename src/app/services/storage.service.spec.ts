import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StorageService, cefrToNumber } from './storage.service';
import { AuthService } from './auth.service';
import { CorrectionSession, WritingEvaluation } from '../models/session.model';

// テスト用セッション生成ヘルパ
function makeSession(partial: Partial<CorrectionSession>): CorrectionSession {
  return {
    id: partial.id ?? Math.random().toString(),
    date: partial.date ?? new Date().toISOString(),
    original: partial.original ?? '',
    corrected: partial.corrected ?? '',
    mistakes: partial.mistakes ?? [],
    evaluation: partial.evaluation,
  };
}

// テスト用 WritingEvaluation 生成ヘルパ（overall系を基準に最小指定）
function makeEval(overrides: Partial<WritingEvaluation> = {}): WritingEvaluation {
  return {
    grammarScore: 7, vocabularyScore: 6, contentScore: 7, overallScore: 6.5, errorDensity: 3,
    grammarCefr: 'B1', vocabularyCefr: 'B1', contentCefr: 'B1', overallCefr: 'B1',
    ...overrides,
  };
}

// n 日前の ISO 文字列
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('cefrToNumber', () => {
  it('CEFR レベルを 1〜6 に変換する', () => {
    expect(cefrToNumber('A1')).toBe(1);
    expect(cefrToNumber('b1')).toBe(3);
    expect(cefrToNumber('C2')).toBe(6);
  });

  it('未知の値は 0 を返す', () => {
    expect(cefrToNumber('X9')).toBe(0);
    expect(cefrToNumber('')).toBe(0);
  });
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    // StorageService は inject(AuthService) と effect() を使うため、
    // TestBed でインジェクションコンテキストを用意する。
    // AuthService は「未ログイン固定」のスタブに差し替え、実 Firebase へ接続させない。
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: AuthService, useValue: { user: signal(null) } },
      ],
    });
    service = TestBed.inject(StorageService);
  });

  describe('getStudyStats', () => {
    it('セッションが無いときはゼロ値を返す', () => {
      const s = service.getStudyStats();
      expect(s.totalSessions).toBe(0);
      expect(s.totalMistakes).toBe(0);
      expect(s.avgMistakes).toBe(0);
      expect(s.currentStreak).toBe(0);
    });

    it('総数・平均ミス数を集計する', () => {
      service.saveSession(makeSession({ mistakes: [{ category: '文法', original: 'a', corrected: 'b', explanation: '' }] }));
      service.saveSession(makeSession({ mistakes: [] }));
      service.saveSession(makeSession({ mistakes: [{ category: '語彙', original: 'c', corrected: 'd', explanation: '' }, { category: '文法', original: 'e', corrected: 'f', explanation: '' }] }));
      const s = service.getStudyStats();
      expect(s.totalSessions).toBe(3);
      expect(s.totalMistakes).toBe(3);
      expect(s.avgMistakes).toBe(1); // 3 / 3
    });

    it('今日・昨日・一昨日の連続学習で streak=3 になる', () => {
      service.saveSession(makeSession({ id: '1', date: daysAgo(0) }));
      service.saveSession(makeSession({ id: '2', date: daysAgo(1) }));
      service.saveSession(makeSession({ id: '3', date: daysAgo(2) }));
      expect(service.getStudyStats().currentStreak).toBe(3);
    });

    it('間が空くと streak は途切れる', () => {
      service.saveSession(makeSession({ id: '1', date: daysAgo(0) }));
      service.saveSession(makeSession({ id: '2', date: daysAgo(3) }));
      expect(service.getStudyStats().currentStreak).toBe(1);
    });
  });

  describe('getEvaluationHistory', () => {
    it('evaluation を持つセッションのみ日付昇順で返す', () => {
      service.saveSession(makeSession({ id: '1', date: daysAgo(2), evaluation: makeEval({ grammarScore: 4, grammarCefr: 'A2' }) }));
      service.saveSession(makeSession({ id: '2', date: daysAgo(1) })); // evaluation なし
      service.saveSession(makeSession({ id: '3', date: daysAgo(0), evaluation: makeEval({ grammarScore: 7, grammarCefr: 'B1' }) }));
      const hist = service.getEvaluationHistory();
      expect(hist.length).toBe(2);
      expect(hist[0].evaluation.grammarScore).toBe(4); // 古い方が先頭
      expect(hist[1].evaluation.grammarScore).toBe(7);
    });
  });
});
