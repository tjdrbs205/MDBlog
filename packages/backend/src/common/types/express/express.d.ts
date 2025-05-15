import { IReadOnlyUser } from "@mdblog/shared/src/types/user.interface";
import { TPayload } from "../../../config/passport/jwt/jwt.payload";

declare global {
  namespace Express {
    interface User extends IReadOnlyUser {}
  }
}

export {};
