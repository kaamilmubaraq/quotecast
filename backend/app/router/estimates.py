from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app.exceptions.exception import Exception500, ExceptionBase
from app.exceptions.generate import generate_error_responses
from app.schemas.estimates import (
    CreateEstimateRequest,
    CreateEstimateResponse,
    GetEstimateResponse,
    GetEstimatesResponse,
    UpdateEstimateRequest,
    UpdateEstimateResponse,
)
from app.services.estimates import EstimateService, get_estimate_service

estimate_router = APIRouter()


@estimate_router.get(
    "",
    summary="見積もり一覧取得",
    response_model=GetEstimatesResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def get_estimates(
    service: EstimateService = Depends(get_estimate_service),
) -> GetEstimatesResponse:
    try:
        return service.get_estimates()
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@estimate_router.get(
    "/{estimate_id}",
    summary="見積もり詳細情報取得",
    response_model=GetEstimateResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def get_estimate(
    estimate_id: UUID,
    service: EstimateService = Depends(get_estimate_service),
) -> GetEstimateResponse:
    try:
        return service.get_estimate(estimate_id)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@estimate_router.post(
    "",
    summary="見積もり作成",
    response_model=CreateEstimateResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def create_estimate(
    request: CreateEstimateRequest = Body(...),
    service: EstimateService = Depends(get_estimate_service),
) -> CreateEstimateResponse:
    try:
        return service.create_estimate(request)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@estimate_router.put(
    "/{estimate_id}",
    summary="見積もり更新",
    response_model=UpdateEstimateResponse,
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def update_estimate(
    estimate_id: UUID,
    request: UpdateEstimateRequest = Body(...),
    service: EstimateService = Depends(get_estimate_service),
) -> UpdateEstimateResponse:
    try:
        return service.update_estimate(estimate_id, request)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@estimate_router.delete(
    "/{estimate_id}",
    summary="見積もり削除",
    responses=generate_error_responses([400, 404, 422, 500]),
)
async def delete_estimate(
    estimate_id: UUID,
    service: EstimateService = Depends(get_estimate_service),
) -> None:
    try:
        service.delete_estimate(estimate_id)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)
