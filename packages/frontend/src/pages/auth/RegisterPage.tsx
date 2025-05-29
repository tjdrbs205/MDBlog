import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { isValidEmail } from "../../utils/isValiEamil";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  const { register } = useAuthContext();

  const handleFormRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFieldError({});

    const formData = new FormData(e.currentTarget);

    const username = formData.get("username")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const passwordConfirm = formData.get("confirmPassword")?.toString() || "";

    if (!isValidEmail(email)) {
      setFieldError({ email: "유효하지 않은 이메일 형식입니다." });
      return;
    }

    if (password !== passwordConfirm) {
      setFieldError({ password: "두 비밀번호가 일치하지 않습니다." });
      return;
    }

    const registerData = {
      username,
      email,
      password,
      passwordConfirm,
    };

    register(registerData).then((error) => {
      if (error) {
        if (typeof error === "string") {
          setFieldError({ email: error });
        } else {
          setFieldError(error);
        }
      } else {
        navigate("/auth/login");
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="card-header">
          <h3 className="mb-0">회원가입</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleFormRegister}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                사용자 이름
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                placeholder="사용자 이름을 입력하세요"
                required
              />
              <p style={{ color: "red" }}>
                {typeof fieldError === "string" ? fieldError : fieldError?.username}
              </p>
            </div>

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
              <p style={{ color: "red" }}>
                {typeof fieldError === "string" ? fieldError : fieldError?.email}
              </p>
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
              <p style={{ color: "red" }}>
                {typeof fieldError === "string" ? fieldError : fieldError?.password}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                비밀번호 확인
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
              <p style={{ color: "red" }}>
                {typeof fieldError === "string" ? fieldError : fieldError?.confirmPassword}
              </p>
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                회원가입
              </button>
            </div>
          </form>
        </div>
        <div className="card-footer text-center">
          <p className="mb-0">
            이미 계정이 있으신가요?
            <Link to="/auth/login" className="text-primary">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
