from typing import Optional, Sequence
from uuid import UUID

from sqlmodel import Session, desc, false, select

from db.models import ItemCategory, ItemCategoryCreate, ItemCategoryUpdate


class CategoryGW:
    def __init__(self, session: Session):
        self.session = session

    def get_categories(self, include_deleted: bool = False) -> Sequence[ItemCategory]:
        statement = select(ItemCategory)
        if not include_deleted:
            statement = statement.where(ItemCategory.is_deleted == false())
        statement = statement.order_by(desc(ItemCategory.created_at))

        return self.session.exec(statement).all()

    def get_category(self, category_id: UUID) -> Optional[ItemCategory]:
        statement = select(ItemCategory).where(
            ItemCategory.id == category_id, ItemCategory.is_deleted == false()
        )
        return self.session.exec(statement).first()

    def create_category(self, category: ItemCategoryCreate) -> ItemCategory:
        db_category = ItemCategory.model_validate(category)
        self.session.add(db_category)
        self.session.flush()
        self.session.refresh(db_category)

        return db_category

    def update_category(
        self, category_id: UUID, category_update: ItemCategoryUpdate
    ) -> Optional[ItemCategory]:
        db_category = self.get_category(category_id)
        if not db_category:
            return None

        category_data = category_update.model_dump(exclude_unset=True)
        for key, value in category_data.items():
            setattr(db_category, key, value)

        self.session.add(db_category)
        self.session.flush()
        self.session.refresh(db_category)
        return db_category

    def delete_category(self, category_id: UUID) -> Optional[ItemCategory]:
        db_category = self.get_category(category_id)
        if not db_category:
            return None

        db_category.is_deleted = True
        self.session.add(db_category)
        self.session.flush()
        self.session.refresh(db_category)
        return db_category
