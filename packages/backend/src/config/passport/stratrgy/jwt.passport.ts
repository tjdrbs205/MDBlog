import { PassportStatic } from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserModel } from "../../../modules/user/model/user.model";
import { TPayload } from "../jwt/jwt.payload";
import RedisClient from "../../data/redis";

const redisClient = RedisClient.getInstance();

export function setupJwtStrategy(passport: PassportStatic) {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET || "default",
    audience: process.env.JWT_AUDIENCE || "default",
    issuer: process.env.JWT_ISSUER || "default",
  };

  passport.use(
    new JwtStrategy(options, async (jwtPayLoad: TPayload, done) => {
      try {
        const userId = jwtPayLoad.id;
        const redisKey = `user:${userId}`;
        const cachedUser = await redisClient.get(redisKey);

        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          return done(null, user);
        }
        const user = await UserModel.findById(userId);
        if (!user) return done(null, false, { message: "유저가 존재하지 않습니다." });

        await redisClient.setUser(redisKey, JSON.stringify(user.readOnlyUser));

        return done(null, user.readOnlyUser);
      } catch (error) {
        console.error(error);
        return done(error);
      }
    })
  );
}
