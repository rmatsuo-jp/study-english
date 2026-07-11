import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { User } from 'firebase/auth';

type AuthStateCallback = (user: User | null) => void;

// Angular の TestBed 用 vitest では相対importのvi.mockが使えないため、auth.service.ts が
// 間接的に読み込む firebase.init.ts はモックせず、その中で使う firebase/* パッケージ側をモックする。
const {
  onAuthStateChangedMock,
  signInWithPopupMock,
  signInWithRedirectMock,
  signOutMock,
  getRedirectResultMock,
} = vi.hoisted(() => ({
  onAuthStateChangedMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signInWithRedirectMock: vi.fn().mockResolvedValue(undefined),
  signOutMock: vi.fn().mockResolvedValue(undefined),
  getRedirectResultMock: vi.fn().mockResolvedValue(null),
}));

vi.mock('firebase/app', () => ({
  initializeApp: () => ({}),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  onAuthStateChanged: onAuthStateChangedMock,
  signInWithPopup: signInWithPopupMock,
  signInWithRedirect: signInWithRedirectMock,
  signOut: signOutMock,
  getRedirectResult: getRedirectResultMock,
  GoogleAuthProvider: class {},
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: () => ({}),
  persistentLocalCache: () => ({}),
  persistentMultipleTabManager: () => ({}),
}));

import { AuthService } from './auth.service';

const ALLOWED_EMAIL = 'dreamskyryou@gmail.com';
const DENIED_EMAIL = 'someone-else@example.com';

function makeUser(email: string): User {
  return { email } as User;
}

describe('AuthService', () => {
  let authStateCallback: AuthStateCallback;

  beforeEach(() => {
    onAuthStateChangedMock.mockReset();
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: AuthStateCallback) => {
      authStateCallback = cb;
      return () => {};
    });
    signInWithPopupMock.mockReset();
    signInWithRedirectMock.mockClear();
    signOutMock.mockReset().mockResolvedValue(undefined);
    getRedirectResultMock.mockClear();
    TestBed.configureTestingModule({ providers: [AuthService] });
  });

  it('初期状態（onAuthStateChanged未発火）はready=false, user=null', () => {
    const service = TestBed.inject(AuthService);
    expect(service.ready()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('許可ユーザーでログインするとuserがセットされ、loginErrorはnull、readyはtrueになる', () => {
    const service = TestBed.inject(AuthService);
    authStateCallback(makeUser(ALLOWED_EMAIL));

    expect(service.user()?.email).toBe(ALLOWED_EMAIL);
    expect(service.loginError()).toBeNull();
    expect(service.ready()).toBe(true);
  });

  it('非許可ユーザーでログインするとuserはnullのまま、loginErrorがセットされ、signOutが呼ばれ、readyはtrueになる', () => {
    const service = TestBed.inject(AuthService);
    authStateCallback(makeUser(DENIED_EMAIL));

    expect(service.user()).toBeNull();
    expect(service.loginError()).not.toBeNull();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(service.ready()).toBe(true);
  });

  it('非許可ユーザーのsignOutが失敗してもreadyはtrueになる', async () => {
    signOutMock.mockRejectedValueOnce(new Error('sign out failed'));
    const service = TestBed.inject(AuthService);
    authStateCallback(makeUser(DENIED_EMAIL));

    expect(service.ready()).toBe(true);
    // 未処理rejectionにならないことを確認するため、マイクロタスクをフラッシュする
    await Promise.resolve();
    await Promise.resolve();
  });

  it('非許可ユーザーで拒否された後、許可ユーザーで再ログインするとloginErrorがクリアされる', () => {
    const service = TestBed.inject(AuthService);
    authStateCallback(makeUser(DENIED_EMAIL));
    expect(service.loginError()).not.toBeNull();

    authStateCallback(makeUser(ALLOWED_EMAIL));
    expect(service.loginError()).toBeNull();
    expect(service.user()?.email).toBe(ALLOWED_EMAIL);
  });

  it('login(): popupが成功すればredirectは呼ばれない', async () => {
    signInWithPopupMock.mockResolvedValueOnce(undefined);
    const service = TestBed.inject(AuthService);

    await service.login();

    expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
    expect(signInWithRedirectMock).not.toHaveBeenCalled();
  });

  it('login(): popupが失敗したらredirectにフォールバックする', async () => {
    signInWithPopupMock.mockRejectedValueOnce(new Error('popup blocked'));
    const service = TestBed.inject(AuthService);

    await service.login();

    expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
    expect(signInWithRedirectMock).toHaveBeenCalledTimes(1);
  });

  it('logout(): loginErrorをクリアしてからsignOutを呼ぶ', async () => {
    const service = TestBed.inject(AuthService);
    authStateCallback(makeUser(DENIED_EMAIL));
    expect(service.loginError()).not.toBeNull();

    await service.logout();

    expect(service.loginError()).toBeNull();
    expect(signOutMock).toHaveBeenCalled();
  });
});
