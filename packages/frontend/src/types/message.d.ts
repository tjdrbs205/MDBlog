interface IMessage {
  message: string;
}

interface ValidationErrprItem {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
}

interface IResponseError {
  message: ValidationErrorItem[] | string;
}

interface IResponse<T> {
  success: boolean;
  body: T | IResponseError;
}
