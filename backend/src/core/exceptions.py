class AppError(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code

class BadRequest(AppError):
    def __init__(self, message="Bad request"):
        super().__init__(message, 400)

class Unauthorized(AppError):
    def __init__(self, message="Unauthorized"):
        super().__init__(message, 401)

class Forbidden(AppError):
    def __init__(self, message="Forbidden"):
        super().__init__(message, 403)

class NotFound(AppError):
    def __init__(self, message="Not found"):
        super().__init__(message, 404)

class Conflict(AppError):
    def __init__(self, message="Conflict"):
        super().__init__(message, 409)
