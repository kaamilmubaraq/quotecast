from pydantic import BaseModel

from db.models import ItemCategoryRead


class GetCategoriesResponse(BaseModel):
    categories: list[ItemCategoryRead]


class CreateCategoryRequest(BaseModel):
    name: str


class CreateCategoryResponse(BaseModel):
    category: ItemCategoryRead


class UpdateCategoryRequest(BaseModel):
    name: str


class UpdateCategoryResponse(BaseModel):
    category: ItemCategoryRead
