from uuid import UUID

from fastapi import Depends
from sqlmodel import Session

from app.exceptions.exception import Exception404
from app.gateways.db.category import CategoryGW
from app.schemas.categories import (
    CreateCategoryRequest,
    CreateCategoryResponse,
    GetCategoriesResponse,
    UpdateCategoryRequest,
    UpdateCategoryResponse,
)
from db.models import ItemCategoryCreate, ItemCategoryRead, ItemCategoryUpdate
from db.session import get_session


class CategoryService:
    def __init__(self, session: Session):
        self.session = session
        self.category_gw = CategoryGW(session)

    def get_categories(self) -> GetCategoriesResponse:
        categories = self.category_gw.get_categories()
        return GetCategoriesResponse(
            categories=[ItemCategoryRead.model_validate(c) for c in categories]
        )

    def create_category(self, request: CreateCategoryRequest) -> CreateCategoryResponse:
        category_create = ItemCategoryCreate(name=request.name)
        category = self.category_gw.create_category(category_create)
        self.session.commit()
        self.session.refresh(category)
        return CreateCategoryResponse(category=ItemCategoryRead.model_validate(category))

    def update_category(
        self, category_id: UUID, request: UpdateCategoryRequest
    ) -> UpdateCategoryResponse:
        category_update = ItemCategoryUpdate(name=request.name)
        category = self.category_gw.update_category(category_id, category_update)
        if not category:
            raise Exception404(f"カテゴリID {category_id} が見つかりません")

        self.session.commit()
        self.session.refresh(category)
        return UpdateCategoryResponse(category=ItemCategoryRead.model_validate(category))

    def delete_category(self, category_id: UUID) -> None:
        category = self.category_gw.delete_category(category_id)
        if not category:
            raise Exception404(f"カテゴリID {category_id} が見つかりません")

        self.session.commit()


def get_category_service(session: Session = Depends(get_session)) -> CategoryService:
    return CategoryService(session)
