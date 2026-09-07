# Docker関連コマンド
.PHONY: up down restart logs migrate migration db-reset backend-shell db-shell rebuild setup

# Docker Composeでコンテナを起動
up:
	docker compose up

# コンテナを停止
down:
	docker compose down

# コンテナを再起動
restart:
	docker compose restart

# バックエンドのログを表示
logs:
	docker compose logs -f backend

# マイグレーションを実行（Dockerコンテナ内で実行）
migrate:
	@echo "🚀 Running migrations in Docker container..."
	docker compose exec backend uv run alembic upgrade head
	@echo "✅ Migration completed!"

# マイグレーションファイルを生成（Dockerコンテナ内で実行）
# 使い方: make migration MESSAGE="add user table"
migration:
	@echo "📝 Generating migration in Docker container..."
	docker compose exec backend uv run alembic revision --autogenerate -m "$(MESSAGE)"
	@echo "✅ Migration file generated!"

# データベースをリセット（全データ削除）
db-reset:
	docker compose down -v
	docker compose up -d

# バックエンドのシェルに入る
backend-shell:
	docker compose exec backend sh

# openapiを生成（バックエンドコンテナ内で実行）
gen:
	docker compose exec backend sh -c "DB_USER=admin DB_PASS=password DB_PORT=54322 DB_HOST=localhost DB_NAME=admin SCHEMA_GEN_MODE=1 uv run python openapi.py > openapi.json"
	cd frontend && yarn gen

# PostgreSQLに接続
db-shell:
	docker compose exec postgres psql -U admin -d app_db

# 全コンテナをビルドし直して起動
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# フロントエンドの開発サーバーを起動
frontend-dev:
	cd frontend && yarn dev

# バックエンドのlintを実行
backend-lint:
	cd backend && make lint

# バックエンドのformatを実行
backend-fmt:
	cd backend && make fmt

# フロントエンドのlintを実行
frontend-lint:
	cd frontend && yarn lint

# フロントエンドのformatを実行
frontend-fmt:
	cd frontend && yarn fmt
