"""Seed script for local development.

Creates ~12 months of quotations so the forecast endpoint and the dashboard
chart have realistic data to work with. Seeded rows use the SEED- prefix on
estimate_number so they can be removed again without touching your own data.

    docker compose exec backend uv run python seed_local.py           # reseed
    docker compose exec backend uv run python seed_local.py --all     # wipe everything, reseed
    docker compose exec backend uv run python seed_local.py --clear   # remove seeded data only
"""

import argparse
import random
from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from sqlmodel import Session, col, select

from db.models import Estimate, EstimateItem, EstimateStatus, ItemCategory
from db.session import engine

SEED_PREFIX = "SEED-"
MONTHS = 12

CATEGORY_NAMES = ["設計", "開発", "テスト", "保守"]
ITEM_NAMES = ["要件定義", "基本設計", "詳細設計", "実装", "単体テスト", "結合テスト", "保守対応"]
PROJECTS = ["受発注システム", "在庫管理システム", "顧客ポータル", "基幹システム刷新"]
CUSTOMERS = ["株式会社A", "株式会社B", "C工業", "D商事", "E製作所"]
STAFF = ["山田 太郎", "佐藤 花子", "鈴木 一郎"]
STATUSES = [
    EstimateStatus.DRAFT,
    EstimateStatus.SENT,
    EstimateStatus.SENT,
    EstimateStatus.ACCEPTED,
    EstimateStatus.ACCEPTED,
    EstimateStatus.REJECTED,
    EstimateStatus.EXPIRED,
]


# 未決着の見積もりが有効期限を過ぎたまま残らないようにする日数
OPEN_WINDOW_DAYS = 60


def resolve_validity(
    status: EstimateStatus, issue_date: date, today: date
) -> tuple[EstimateStatus, date]:
    """ステータスと有効期限の辻褄を合わせる

    「下書きのまま期限切れ」という見積もりが並ぶのは実際の営業では起こらない。
    直近に出した未決着の見積もりは期限を将来に置き、
    それより古い未決着のものは期限切れとして扱う。

    Returns:
        (ステータス, 有効期限)
    """
    settled = (EstimateStatus.ACCEPTED, EstimateStatus.REJECTED)
    if status in settled:
        # 決着済みは当時の期限のままでよい
        return status, issue_date + timedelta(days=30)

    if status is EstimateStatus.EXPIRED:
        return status, issue_date + timedelta(days=30)

    age_days = (today - issue_date).days
    if age_days > OPEN_WINDOW_DAYS:
        # 古いまま動いていない見積もりは期限切れ
        return EstimateStatus.EXPIRED, issue_date + timedelta(days=30)

    # 進行中の見積もり。期限が近いものから余裕のあるものまで散らす
    return status, today + timedelta(days=random.randint(1, 45))


def clear(session: Session, include_all: bool = False) -> int:
    """Delete seeded quotations. Line items go with them via cascade.

    include_all also removes hand-made quotations, for a completely clean dataset.
    """
    statement = select(Estimate)
    if not include_all:
        statement = statement.where(col(Estimate.estimate_number).startswith(SEED_PREFIX))

    estimates = session.exec(statement).all()
    for estimate in estimates:
        session.delete(estimate)
    session.commit()
    return len(estimates)


def get_or_create_categories(session: Session) -> list[ItemCategory]:
    """Reuse categories that already exist, create the rest."""
    categories = []
    for name in CATEGORY_NAMES:
        existing = session.exec(select(ItemCategory).where(ItemCategory.name == name)).first()
        if existing is None:
            existing = ItemCategory(name=name)
            session.add(existing)
        categories.append(existing)
    session.commit()
    return categories


def seed(session: Session, categories: list[ItemCategory]) -> int:
    """Create MONTHS months of quotations with a gentle upward trend."""
    random.seed(42)  # fixed so re-running produces the same data
    today = date.today()
    created = 0

    for i in range(MONTHS):
        month = today.replace(day=1) - relativedelta(months=MONTHS - 1 - i)
        is_current_month = month.year == today.year and month.month == today.month
        # never issue a quotation in the future
        max_day = today.day if is_current_month else 28

        monthly_count = 3 + i // 3 + random.randint(0, 2)
        if is_current_month:
            # Only part of the month has elapsed, so only part of its quotations exist yet.
            # Without this the algorithm's partial-month adjustment scales an already-full
            # month up by (days_in_month / today), producing absurd forecasts.
            days_in_month = ((month + relativedelta(months=1)) - month).days
            monthly_count = max(1, round(monthly_count * today.day / days_in_month))

        for j in range(monthly_count):
            issue_date = month.replace(day=random.randint(1, max(1, max_day)))
            status = random.choice(STATUSES)
            status, expiry_date = resolve_validity(status, issue_date, today)
            estimate = Estimate(
                estimate_number=f"{SEED_PREFIX}{month:%Y%m}-{j + 1:04d}",
                status=status,
                issue_date=issue_date,
                expiry_date=expiry_date,
                project_name=f"{random.choice(PROJECTS)} フェーズ{i % 4 + 1}",
                customer_name=random.choice(CUSTOMERS),
                in_charge_name=random.choice(STAFF),
            )
            session.add(estimate)

            for _ in range(random.randint(1, 4)):
                category = random.choice(categories)
                session.add(
                    EstimateItem(
                        estimate_id=estimate.id,
                        category_id=category.id,
                        item_name=random.choice(ITEM_NAMES),
                        price=50_000 + i * 8_000 + random.randint(0, 40_000),
                        quantity=random.randint(1, 8),
                    )
                )
            created += 1

    session.commit()
    return created


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true", help="remove data and exit")
    parser.add_argument("--all", action="store_true", help="also remove hand-made quotations")
    args = parser.parse_args()

    with Session(engine) as session:
        removed = clear(session, include_all=args.all)
        print(f"removed {removed} quotations ({'all' if args.all else 'seeded only'})")
        if args.clear:
            return

        categories = get_or_create_categories(session)
        created = seed(session, categories)
        print(f"created {created} quotations across {MONTHS} months")


if __name__ == "__main__":
    main()
