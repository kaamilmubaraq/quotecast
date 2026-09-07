import uuid
from datetime import date, datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

# JST timezone
tz = timezone(timedelta(hours=9), name="JST")


class TableBase(SQLModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz))
    updated_at: datetime = Field(
        default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now(tz)}
    )


class EstimateStatus(str, Enum):
    DRAFT = "draft"  # 下書き
    SENT = "sent"  # 送付済み
    ACCEPTED = "accepted"  # 受注/承認
    REJECTED = "rejected"  # 失注/却下
    EXPIRED = "expired"  # 期限切れ


class ItemCategoryBase(SQLModel):
    name: str = Field(description="グループ名")


class ItemCategory(ItemCategoryBase, TableBase, table=True):
    __tablename__ = "item_categories"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_deleted: bool = Field(default=False, description="削除フラグ")

    items: list["EstimateItem"] = Relationship(back_populates="category")


class ItemCategoryCreate(ItemCategoryBase):
    pass


class ItemCategoryRead(ItemCategoryBase):
    id: uuid.UUID
    is_deleted: bool


class ItemCategoryUpdate(SQLModel):
    name: str | None = None


class EstimateItemBase(SQLModel):
    item_name: str = Field(description="品名・摘要")
    price: int = Field(description="単価")
    quantity: int = Field(description="数量")
    category_id: uuid.UUID = Field(foreign_key="item_categories.id", description="カテゴリID")


class EstimateItem(EstimateItemBase, TableBase, table=True):
    __tablename__ = "estimate_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    estimate_id: uuid.UUID = Field(foreign_key="estimates.id")

    estimate: "Estimate" = Relationship(back_populates="items")
    category: "ItemCategory" = Relationship(back_populates="items")

    @property
    def subtotal(self) -> int:
        return self.price * self.quantity


class EstimateItemCreate(EstimateItemBase):
    pass


class EstimateItemRead(EstimateItemBase):
    id: uuid.UUID
    subtotal: int
    category: "ItemCategoryRead"


class EstimateBase(SQLModel):
    estimate_number: str = Field(unique=True, index=True, description="見積書番号")
    status: EstimateStatus = Field(default=EstimateStatus.DRAFT, description="ステータス")
    issue_date: date = Field(default_factory=date.today, description="発行日")
    expiry_date: date = Field(description="有効期限")
    project_name: str = Field(description="件名")
    customer_name: Optional[str] = Field(default=None, description="顧客名")
    in_charge_name: Optional[str] = Field(default=None, description="担当者名")
    remarks: Optional[str] = Field(default=None)


class Estimate(EstimateBase, TableBase, table=True):
    __tablename__ = "estimates"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_deleted: bool = Field(default=False, description="削除フラグ")

    items: list["EstimateItem"] = Relationship(
        back_populates="estimate",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class EstimateCreate(EstimateBase):
    pass


class EstimateRead(EstimateBase):
    id: uuid.UUID
    status: EstimateStatus  # 明示的に必須化
    items: list["EstimateItemRead"] = []


class EstimateUpdate(SQLModel):
    estimate_number: Optional[str] = None
    status: Optional[EstimateStatus] = None
    issue_date: Optional[date] = None
    project_name: Optional[str] = None
    customer_name: Optional[str] = None
    in_charge_name: Optional[str] = None
    remarks: Optional[str] = None
    expiry_date: Optional[date] = None
    items: Optional[list["EstimateItemCreate"]] = None
