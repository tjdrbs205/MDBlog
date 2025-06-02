import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ILoginUser } from "@mdblog/shared/src/types/user.interface";
import { useAuthContext } from "../../context/AuthContext";
import { isValidEmail } from "../../utils/isValiEamil";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState<string | Record<string, string> | null>("");
  const { login } = useAuthContext();

  const handleFormLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const currentEamil = formData.get("email")?.toString() || "";
    const currentPassword = formData.get("password")?.toString() || "";

    if (!isValidEmail(currentEamil)) {
      setEmailError("유효하지 않은 이메일 형식입니다.");
      return;
    }

    const loginData: ILoginUser = {
      email: currentEamil,
      password: currentPassword,
    };

    login(loginData).then((error) => {
      if (error) {
        setEmailError(error);
      } else {
        navigate("/");
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="card-header">
          <h3 className="mb-0">로그인</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleFormLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                이메일
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                placeholder="이메일을 입력하세요"
                required
              />
              <p style={{ color: "red" }}>{emailError?.toString()}</p>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <div className="d-grid mb-3">
              <button type="submit" className="btn btn-primary">
                로그인
              </button>
            </div>
          </form>
        </div>
        <div className="card-footer text-center">
          <p className="mb-0">
            계정이 없으신가요?
            <Link to="/auth/register" className="text-primary">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
