# Frontend

## 開発環境構築

```bash
volta install node
volta install yarn

yarn
yarn dev
```

## Getting Started

### 環境設定

NodeとYarnのバージョンを設定・確認してください（以下は[Volta](https://volta.sh/)を使った場合の例）

CI環境と合わせるため Yarn v1を使用しています

```bash
# 初回（package.jsonへ固定）
volta pin node@24.11.0
volta pin yarn@1.22.22

# 以降（package.jsonから指定）
volta install node
volta install yarn
```

### 依存パッケージのインストール

Yarnによるパッケージのインストール

```bash
yarn  # or yarn install
```

### 開発サーバーの立ち上げ

以下のコマンドで開発サーバーを立ち上げる

```bash
yarn dev
```

## ディレクトリ構成

https://zenn.dev/yamu_official/articles/70f59488e8415d

## UIライブラリ: shadcn

https://ui.shadcn.com/

### UIコンポーネント追加例

```bash
yarn dlx shadcn@latest add button
```

## State管理ライブラリ: jotai

https://jotai.org/docs/guides/nextjs

## 非同期状態管理ライブラリ: TanStack Query

https://qiita.com/suin/items/e2df562b0c2be7e2a123#tanstack-query-react-query

## Routing

React RouterのFile Route Conventionsを使用しています

https://reactrouter.com/how-to/file-route-conventions

## 開発環境とAPI連携

APIクライアントの生成とモックサーバー の設定に以下のライブラリを使用しています。

1. **Orval**

   APIクライアントとHooksの自動生成

   バックエンドの openapi.json を基に、フロントエンドで使用する TanStack Query (React Query) の Hooks や、MSW用のリクエストハンドラーを自動で生成します。

参照: [Orval公式ガイド](https://orval.dev/guides/react-query)

2. **MSW (Mock Service Worker)**

   モックサーバー

   フロントエンドからの APIリクエストをインターセプトし、実際のエンドポイントにアクセスすることなく、定義された仮のレスポンスを返すライブラリです。

   使用方法:

   ローカル環境において、基本的にMSWモックサーバーが起動します。

   MSWモックサーバーを**起動したくない場合**は下記のコマンドで起動してください

   ```bash
   yarn dev --mode production
   ```

参照: [MSW公式ドキュメント](https://mswjs.io/docs)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
