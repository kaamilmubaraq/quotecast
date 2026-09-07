from app.exceptions.exception import ExceptionCode, exceptions


def generate_error_responses(exception_codes: list[ExceptionCode]):
    """swaggerに独自レスポンス定義を記載するための変換関数

    ; ;;;/[=]  Args:
            exceptions (list[ExceptionCode]): エラーレスポンスコードリスト

        Returns:
            _type_: swagger定義json
    """
    responses = {}

    for code, exception in exceptions.items():
        if code not in exception_codes:
            continue

        responses[exception.status_code] = {
            "description": exception.description,
            "content": {
                "application/json": {
                    "example": {
                        "detail": exception.example,
                    },
                },
            },
        }

    return responses
