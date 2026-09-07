from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app.exceptions.exception import Exception500, ExceptionBase
from app.exceptions.generate import generate_error_responses
from app.schemas.categories import (
    CreateCategoryRequest,
    CreateCategoryResponse,
    GetCategoriesResponse,
    UpdateCategoryRequest,
    UpdateCategoryResponse,
)
from app.services.categories import CategoryService, get_category_service

category_router = APIRouter()


@category_router.get(
    "",
    summary="カテゴリ一覧取得",
    response_model=GetCategoriesResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def get_categories(
    service: CategoryService = Depends(get_category_service),
) -> GetCategoriesResponse:
    try:
        return service.get_categories()
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@category_router.post(
    "",
    summary="カテゴリ作成",
    response_model=CreateCategoryResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def create_category(
    request: CreateCategoryRequest = Body(...),
    service: CategoryService = Depends(get_category_service),
) -> CreateCategoryResponse:
    try:
        return service.create_category(request)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@category_router.put(
    "/{category_id}",
    summary="カテゴリ更新",
    response_model=UpdateCategoryResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def update_category(
    category_id: UUID,
    request: UpdateCategoryRequest = Body(...),
    service: CategoryService = Depends(get_category_service),
) -> UpdateCategoryResponse:
    try:
        return service.update_category(category_id, request)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@category_router.delete(
    "/{category_id}",
    summary="カテゴリ削除",
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def delete_category(
    category_id: UUID,
    service: CategoryService = Depends(get_category_service),
) -> None:
    try:
        service.delete_category(category_id)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)
