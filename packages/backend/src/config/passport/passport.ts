import passport from "passport";
import { setupLocalStrategy } from "./stratrgy/local.Passport";
import { setupJwtStrategy } from "./stratrgy/jwt.passport";

setupLocalStrategy(passport);
setupJwtStrategy(passport);

export default passport;
