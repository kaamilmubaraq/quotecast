# QuoteCast（クオートキャスト）

**需要予測エンジンを自作した、見積もり管理アプリケーション。**

見積もりの作成・管理・PDF出力に加えて、過去の実績から今後の見積もり件数・金額を予測します。
予測エンジンは Prophet や statsmodels を使わず、NumPy だけで一から実装しています。

[![CI](https://github.com/kaamilmubaraq/quotecast/actions/workflows/ci.yml/badge.svg)](https://github.com/kaamilmubaraq/quotecast/actions/workflows/ci.yml)

[English README →](./README.md)

---

## 概要

QuoteCast は営業チーム向けの見積もり管理システムです。

| 機能 | 内容 |
| --- | --- |
| **見積もり管理** | 明細・カテゴリ・グループ（ドラッグ&ドロップ並び替え）を持つ見積もりのCRUD |
| **PDF出力** | ブラウザ上で印刷可能な見積書PDFを生成、プレビュー表示 |
| **ダッシュボード** | 月別の金額・件数推移グラフ、サマリーカード、期間選択 |
| **需要予測** | 今後の見積もり件数・金額を95%予測区間つきで予測 |
| **絞り込み** | ステータス・発行日・有効期限による見積もり一覧のフィルター |

コードとして読む価値があるのは、需要予測エンジンの部分です。

---

## 需要予測エンジン

業務アプリの「予測機能」は、移動平均にトレンド線を足しただけのものが少なくありません。
このプロジェクトでは「なぜその予測値になるのか」を説明できることを重視して実装しました。

### 仕組み

**1. 複数のモデルを候補として持つ** — それぞれ状態空間表現から実装しています。

| モデル | 挙動 | 採用理由 |
| --- | --- | --- |
| 単純指数平滑 ETS(A,N,N) | 水準を追従する水平予測 | ノイズが大きくトレンドが不明瞭な系列で最も頑健 |
| 減衰トレンド ETS(A,A<sub>d</sub>,N) | トレンドを φ で減衰させながら外挿 | M4コンペティション上位手法。長期予測が発散しない |
| Theta法 | 回帰直線とSESの水準を等加重で結合 | M3コンペティション優勝手法。M4では月次データで最良 |
| ナイーブ（ランダムウォーク） | 直近の実績をそのまま延長 | 水準の急変に即座に追従する。予測の標準ベンチマーク |
| 3手法平均 | 上記3手法の等加重平均 | M2優勝手法 COMB S-H-D と同じ発想。どれが正解か決められない時は平均が強い |

**2. 平滑化パラメータは推定する。** α・β・φ は決め打ちにせず、1期先誤差の平方和が最小になる
組み合わせをグリッド探索で求めます。`alpha = 0.4` のようなマジックナンバーはありません。

**3. モデルは系列ごとにバックテストで選ぶ。** rolling origin 交差検証で予測起点を1ヶ月ずつ進め、
各時点で「起点より前のデータだけ」を使って学習し、MASEで候補を比較します。
その系列で実際に当たっていた手法が選ばれるため、トレンドが明瞭ならトレンドモデルが、
ノイズが大きければ水平予測が選ばれます。

**4. 信頼度は残差から導く。** 予測区間は各モデルの予測分散の式（例: SESなら σ²ₕ = σ²[1 + α²(h-1)]）
から計算します。経験的な減衰カーブではないため、予測が先になるほど、また系列の変動が大きいほど、
信頼度は自動的に下がります。

**5. 予測は決定的。** 同じ実績からは必ず同じ予測値が出ます。

### 実際に精度は出ているのか

5つの需要パターンに対する rolling origin バックテストの結果です（MASE、小さいほど良い。
1.000 は「前月の値をそのまま使う」のと同等という意味）。

| 需要パターン | ナイーブ | 平均 | ドリフト | **QuoteCast** |
| --- | --- | --- | --- | --- |
| 上昇トレンド | 1.169 | 3.608 | 1.029 | **0.925** |
| 下降トレンド | 1.261 | 4.927 | **1.009** | 1.014 |
| 横ばい | 0.987 | 0.792 | 1.075 | **0.767** |
| 水準シフト | **1.385** | 3.645 | 1.533 | 1.594 |
| 高変動 | **1.628** | 1.829 | 1.778 | **1.628** |
| **全体** | 1.286 | 2.960 | 1.285 | **1.185** |

再現方法:

```bash
docker compose exec backend uv run python scripts/benchmark_forecast.py
```

**正直な弱点:** 「水準シフト」パターンではナイーブ予測に負けています。
一度きりの構造変化はどの手法でも予測できず、変化後にどれだけ速く追従できるかだけの勝負になります。
平滑化を行う以上、直近の値をそのまま使うナイーブより追従は遅くなります。
追従を速くするには直近月の重みを上げることになりますが、それは他の4パターンすべての精度を犠牲にします。
そうした系列では交差検証がナイーブを選べるよう、候補にナイーブを含めてあります。

### 季節性を実装していない理由

月次の季節調整は次に実装したくなる機能ですが、意図的に見送っています。
12ヶ月の季節指数を推定するには最低3周期（36ヶ月）が必要とされており、
これはM4コンペティションのベンチマーク実装が採用している基準です。
本APIが遡れる履歴は最大24ヶ月のため、各月の指数を2観測以下から推定することになり、
シグナルではなくノイズが増えるだけになります。
この判断はモジュールのdocstringに記録してあり、履歴が増えた時点で見直せるようにしています。

### 参考文献

- Hyndman & Athanasopoulos (2021), *Forecasting: Principles and Practice*, 3rd ed., ch. 8
- Hyndman & Billah (2003), *Unmasking the Theta method*, International Journal of Forecasting 19(2)
- Assimakopoulos & Nikolopoulos (2000), *The theta model*, International Journal of Forecasting 16(4)

---

## アーキテクチャ

```
backend/
├── algorithm/              # 予測ライブラリ — 純粋な計算のみ。DB・フレームワークに非依存
│   ├── smoothing.py        # 各モデル: SES / 減衰トレンド / Theta法 / ナイーブ / 平均
│   ├── evaluation.py       # rolling origin 交差検証とMASE
│   └── forecast_algorithm.py  # 前処理・予測区間・トレンド分析の統合
├── app/
│   ├── router/             # HTTP層 — ルーティング、バリデーション、エラーレスポンス
│   ├── services/           # ビジネスロジック
│   ├── gateways/db/        # データアクセス
│   └── schemas/            # リクエスト・レスポンスの型
├── db/                     # SQLModelのモデルとセッション管理
└── scripts/                # ベンチマーク用スクリプト

frontend/
├── app/
│   ├── routes/             # React Router のファイルベースルーティング
│   ├── components/         # 機能単位のUIコンポーネント
│   ├── hooks/              # データ取得と画面状態
│   └── gen/                # 自動生成APIクライアント（手で編集しない）
```

設計上、特に意識した境界が2つあります。

**予測ライブラリはWebアプリを知らない。** 月次の数値リストを受け取って予測を返すだけで、
DBもFastAPIもI/Oも持ちません。だからこそ分岐まで含めたテストカバレッジ100%を維持でき、
このプロジェクトの外でも再利用できます。

**フロントエンドのAPIクライアントは書かずに生成する。** FastAPIが出力したOpenAPIスキーマから
[Orval](https://orval.dev/) が型付きのReact Queryフックを生成します。
バックエンドのレスポンス形が変わると、実行時エラーではなくコンパイルエラーとして検出されます。
`app/gen/` は `make gen` で再生成し、手では編集しません。

---

## 技術スタック

**バックエンド** — Python 3.12, FastAPI, SQLModel, Alembic, PostgreSQL, NumPy, uv, Ruff, mypy, pytest
**フロントエンド** — TypeScript, React 19, React Router 7, TanStack Query, Tailwind CSS, shadcn/ui, Recharts, Vite
**インフラ** — Docker Compose, GitHub Actions

---

## セットアップ

**必要環境:** Docker, Node.js 22以上, Yarn

```bash
# 1. APIとデータベースを起動
docker compose up -d

# 2. マイグレーションと約12ヶ月分のサンプルデータ投入
make migrate
docker compose exec backend uv run python seed_local.py

# 3. フロントエンドを起動
cd frontend
cp .env.local.example .env.local
yarn install && yarn dev
```

シードスクリプトは1年分の見積もり実績を生成します。
ダッシュボードのグラフと需要予測APIは、この程度の履歴があってはじめて意味のある表示になります。

| サービス | URL |
| --- | --- |
| フロントエンド | http://localhost:5173 |
| API | http://localhost:8000 |
| APIドキュメント (Swagger) | http://localhost:8000/docs |

---

## テストと品質管理

```bash
# バックエンド: テスト・Lint・型チェック
docker compose exec backend uv run pytest tests -q
docker compose exec backend uv run ruff check .
docker compose exec backend uv run mypy .

# 予測エンジンのカバレッジ — 分岐を含めて100%を必須としている
docker compose exec backend uv run coverage run --source=algorithm -m pytest tests -q
docker compose exec backend uv run coverage report

# フロントエンド
cd frontend && yarn lint && yarn tsc -b
```

これらはすべて push / pull request ごとにCIで実行されます。

予測エンジンのテストは、期待値を固定値で書くのではなく**満たすべき性質**を検証しています。
「予測区間は点予測を含む」「不確実性は先に行くほど増える」
「減衰トレンドは発散せず ℓ + b·φ/(1-φ) に収束する」「同じ入力からは同じ出力が出る」といった形です。
固定値のテストはモデルを改良するたびに書き直しになりますが、
性質のテストは予測が意味をなさなくなった時にだけ落ちます。

---

## ライセンス

MIT
