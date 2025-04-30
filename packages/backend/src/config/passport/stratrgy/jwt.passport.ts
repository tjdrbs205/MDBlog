import { PassportStatic } from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserModel } from "../../../modules/user/model/user.model";

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "default",
};

export function setupJwtStrategy(passport: PassportStatic) {
  passport.use(
    new JwtStrategy(options, async (jwtPayLoad, done) => {
      try {
        const user = await UserModel.findById(jwtPayLoad.id);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (error) {
        console.error(error);
        return done(error, false);
      }
    })
  );
}
