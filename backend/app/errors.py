class AppError(Exception):
    status = 500
    message = "algo salió mal"

    def __init__(self, message: str | None = None):
        self.message = message or self.__class__.message
        super().__init__(self.message)


class NotFound(AppError):
    status = 404
    message = "no encontramos este carrete"


class Unauthorized(AppError):
    status = 401
    message = "entra con tu nombre primero"


class Forbidden(AppError):
    status = 403
    message = "no permitido"


class Conflict(AppError):
    status = 409
    message = "ya está cubierto"


class ValidationErr(AppError):
    status = 400
    message = "datos inválidos"
