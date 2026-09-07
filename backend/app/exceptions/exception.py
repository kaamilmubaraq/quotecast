import logging
import traceback
from typing import Any, Literal, Optional, Type

from fastapi import HTTPException

ExceptionCode = Literal[400, 403, 404, 408, 422, 500]


class ExceptionBase(HTTPException):
    description: str
    status_code: ExceptionCode
    example: str
    detail: str
    headers: Optional[dict[str, str]] = None

    def __init__(self, detail: str, headers=None):
        self.detail = detail
        self.headers = headers


class Exception400(ExceptionBase):
    status_code = 400
    description = "Bad Request"
    example = "リクエスト内容が不正です。"

    def __init__(self, detail: str = example, headers: Optional[dict[str, str]] = None):
        super().__init__(detail=detail, headers=headers)


class Exception403(ExceptionBase):
    status_code = 403
    description = "Forbidden"
    example = "アクセス権限がありません。"

    def __init__(self, detail: str = example, headers: Optional[dict[str, str]] = None):
        super().__init__(detail=detail, headers=headers)


class Exception404(ExceptionBase):
    status_code = 404
    description = "Not Found"
    example = "リソースが見つかりません。"

    def __init__(self, detail: str = example, headers: Optional[dict[str, str]] = None):
        super().__init__(detail=detail, headers=headers)


class Exception408(ExceptionBase):
    status_code = 408
    description = "Request Timeout"
    example = "リクエストがタイムアウトしました。"

    def __init__(
        self, e: Exception, detail: str = example, headers: Optional[dict[str, str]] = None
    ):
        print(f"{self.status_code} Request Timeout Error: {e}")
        super().__init__(detail=detail, headers=headers)


class Exception422(ExceptionBase):
    status_code = 422
    description = "Unprocessable Entity"
    example = "リクエストを処理できません。"

    def __init__(self, detail: str = example, headers: Optional[dict[str, str]] = None):
        print(traceback.format_exc())
        logging.error(traceback.format_exc())
        super().__init__(detail=detail, headers=headers)


class Exception500(ExceptionBase):
    description = "System Error"
    status_code = 500
    example = "システム管理者にお問い合わせください。"

    def __init__(
        self,
        e: Exception,
        detail: str = example,
        headers: Optional[dict[str, str]] = None,
        arg: Optional[Any] = None,
    ):
        super().__init__(detail=detail, headers=headers)
        print(e)
        logging.error(f"System error: {e}, detail:{detail}, Arg:{arg}")
        traceback.print_exc()


exceptions: dict[ExceptionCode, Type[ExceptionBase]] = {
    400: Exception400,
    403: Exception403,
    404: Exception404,
    408: Exception408,
    422: Exception422,
    500: Exception500,
}
