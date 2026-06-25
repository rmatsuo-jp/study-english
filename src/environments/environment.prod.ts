/**
 * @file 本番環境用の設定値。本番ビルド時に environment.ts と差し替えられる。
 * Firebase の構成は同一プロジェクトを参照する（構成値はクライアント公開情報）。
 */

// ── Firebase 構成（クライアント公開情報。保護は Firestore セキュリティルールで担保） ─
export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyAutqBenGPJzQPjBy81pxGAqPROIKoAos8',
    authDomain: 'my-apps-sync.firebaseapp.com',
    projectId: 'my-apps-sync',
    storageBucket: 'my-apps-sync.firebasestorage.app',
    messagingSenderId: '757775114616',
    appId: '1:757775114616:web:0f288ea4f994c4d657a88d',
  },
};
