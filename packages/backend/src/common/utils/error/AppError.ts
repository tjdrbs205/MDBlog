class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message: string = "해당 리소스를 찾을 수 없습니다.") {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "인증되지 않은 사용자입니다.") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "접근이 금지된 리소스입니다.") {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  errors?: Record<string, string>;
  constructor(message: string = "유효성 검사에 실패했습니다.", errors?: Record<string, string>) {
    super(message, 422);
    this.errors = errors;
  }
}

export { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError };
