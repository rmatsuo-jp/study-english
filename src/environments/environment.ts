/**
 * @file 開発環境用の設定値。Firebase の構成（公開情報）を保持する。
 * 本番ビルド時は angular.json の fileReplacements により environment.prod.ts に差し替えられる。
 */

// ── Firebase 構成（クライアント公開情報。保護は Firestore セキュリティルールで担保） ─
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyAutqBenGPJzQPjBy81pxGAqPROIKoAos8',
    authDomain: 'my-apps-sync.firebaseapp.com',
    projectId: 'my-apps-sync',
    storageBucket: 'my-apps-sync.firebasestorage.app',
    messagingSenderId: '757775114616',
    appId: '1:757775114616:web:0f288ea4f994c4d657a88d',
  },
};
