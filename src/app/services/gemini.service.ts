/**
 * @file Google Gemini API との通信を担うサービス。
 * correct() でプロンプトを送信し、レスポンスから添削文・mistakes JSON・定量評価(WritingEvaluation)・復習カードを分離して返す。
 * gemini-3.5-flash でエラーが発生した場合、gemini-2.5-flash に自動フォールバックする。
 */
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistake, ReviewItem, WritingEvaluation } from '../models/session.model';

export interface CorrectionResult {
  corrected: string;
  mistakes: Mistake[];
  evaluation?: WritingEvaluation;
  reviewItems?: ReviewItem[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  // ── API 呼び出し（gemini-3.5-flash 失敗時は gemini-2.5-flash にフォールバック） ─
  async correct(apiKey: string, model: string, prompt: string, userText: string): Promise<CorrectionResult> {
    try {
      return await this.callApi(apiKey, model, prompt, userText);
    } catch (e) {
      if (model === 'gemini-3.5-flash') {
        return await this.callApi(apiKey, 'gemini-2.5-flash', prompt, userText);
      }
      throw e;
    }
  }

  private async callApi(apiKey: string, model: string, prompt: string, userText: string): Promise<CorrectionResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });

    const fullPrompt = prompt.replace('{USER_TEXT}', userText);
    const result = await genModel.generateContent(fullPrompt);
    const text = result.response.text();

    const mistakes = this.parseMistakes(text);
    const evaluation = this.parseEvaluation(text);
    const reviewItems = this.parseReview(text);
    const corrected = text
      .replace(/<mistakes>[\s\S]*?<\/mistakes>/g, '')
      .replace(/<evaluation>[\s\S]*?<\/evaluation>/g, '')
      .replace(/<review>[\s\S]*?<\/review>/g, '')
      .trim();

    return { corrected, mistakes, evaluation, reviewItems };
  }

  // ── レスポンス解析: <mistakes>...</mistakes> タグから JSON を抽出 ─
  private parseMistakes(text: string): Mistake[] {
    const match = text.match(/<mistakes>([\s\S]*?)<\/mistakes>/);
    if (!match) return [];
    try {
      const json = JSON.parse(match[1].trim()) as { mistakes: Mistake[] };
      return Array.isArray(json.mistakes) ? json.mistakes : [];
    } catch {
      return [];
    }
  }

  // ── レスポンス解析: <evaluation>...</evaluation> タグから定量評価を抽出（失敗時 undefined） ─
  // スコア5項目（数値）とCEFR4項目（文字列）が型まで揃う時のみ採用する。
  private parseEvaluation(text: string): WritingEvaluation | undefined {
    const match = text.match(/<evaluation>([\s\S]*?)<\/evaluation>/);
    if (!match) return undefined;
    try {
      const json = JSON.parse(match[1].trim()) as Partial<WritingEvaluation>;
      const num = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);
      const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
      if (
        num(json.grammarScore) && num(json.vocabularyScore) && num(json.contentScore) &&
        num(json.overallScore) && num(json.errorDensity) &&
        str(json.grammarCefr) && str(json.vocabularyCefr) && str(json.contentCefr) && str(json.overallCefr)
      ) {
        return {
          grammarScore: json.grammarScore,
          vocabularyScore: json.vocabularyScore,
          contentScore: json.contentScore,
          overallScore: json.overallScore,
          errorDensity: json.errorDensity,
          grammarCefr: json.grammarCefr,
          vocabularyCefr: json.vocabularyCefr,
          contentCefr: json.contentCefr,
          overallCefr: json.overallCefr,
        };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  // ── レスポンス解析: <review>...</review> タグから復習カードを抽出 ─
  // 必須フィールドが揃い、choices が4要素かつ正解(answer)を含む項目だけを採用する。
  // 不正な項目は除外し、1件も残らなければ undefined を返す（保存・同期では undefined を持たせない）。
  private parseReview(text: string): ReviewItem[] | undefined {
    const match = text.match(/<review>([\s\S]*?)<\/review>/);
    if (!match) return undefined;
    try {
      const json = JSON.parse(match[1].trim()) as { reviewItems?: ReviewItem[] };
      if (!Array.isArray(json.reviewItems)) return undefined;
      const valid = json.reviewItems.filter(
        (r) =>
          r &&
          typeof r.sentence === 'string' &&
          typeof r.answer === 'string' &&
          typeof r.hint === 'string' &&
          typeof r.translation === 'string' &&
          Array.isArray(r.choices) &&
          r.choices.length === 4 &&
          r.choices.includes(r.answer)
      );
      return valid.length > 0 ? valid : undefined;
    } catch {
      return undefined;
    }
  }
}
