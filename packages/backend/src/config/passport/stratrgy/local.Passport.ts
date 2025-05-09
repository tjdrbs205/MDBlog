import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { UserModel } from "../../../modules/user/model/user.model";

export function setupLocalStrategy(passport: PassportStatic) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const exUser = await UserModel.findOne({ email });
          if (exUser) {
            const result = await exUser.comparePassword(password);
            if (result) {
              done(null, exUser.readOnlyUser);
            } else {
              done(null, false, { message: "비밀번호가 일치하지 않습니다." });
            }
          } else {
            done(null, false, { message: "가입되지 않은 이메일입니다." });
          }
        } catch (error) {
          console.error(error);
          return done(error);
        }
      }
    )
  );
}
