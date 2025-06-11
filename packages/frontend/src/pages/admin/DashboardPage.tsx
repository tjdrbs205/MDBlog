import "../../styles/admin.css";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useRequest from "../../hooks/useRequest.hook";
import { IDashboardData } from "@mdblog/shared/src/types/admin.interface";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<IDashboardData | null>(null);
  const { accessToken } = useAuthContext();
  const { data, error, loading } = useRequest<IDashboardData>("/admin/dashboard", {
    accessToken,
  });

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  if (loading) return <div>로딩 중...</div>;
  if (!data) return <div>대시보드 데이터를 불러오는 데 실패했습니다.</div>;

  return (
    <div className="admin-dashboard">
      <h1>관리자 대시보드</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-people"></i>
          </div>

          <div className="stat-content">
            <h3>사용자 수</h3>
            <p className="stat-value">{stats?.users.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-file-earmark-text"></i>{" "}
          </div>
          <div className="stat-content">
            <h3>총 게시물</h3>
            <p className="stat-value">{stats?.posts.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-eye"></i>
          </div>
          <div className="stat-content">
            <h3>총 방문자</h3>
            <p className="stat-value">{stats?.visits.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>오늘 방문자</h3>
            <p className="stat-value">{stats?.visits.today.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>최근 게시물</h2>
            <Link to="/posts" className="view-all">
              전체보기
            </Link>
          </div>
          <div className="section-content">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>조회수</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {stats?.posts.recent.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    </td>
                    <td>{post.author.username}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>{post.view}</td>
                    <td className="action-buttons">
                      <Link
                        to={`/posts/${post.id}/edit`}
                        className="btn btn-sm btn-edit"
                        style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          border: "none",
                          borderRadius: "0.25rem",
                          display: "inline-block",
                        }}
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>최근 가입 회원</h2>
            <Link to="" className="view-all">
              전체보기
            </Link>
          </div>

          <div className="section-content">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>가입일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users.recent.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`status ${
                          user.role === "admin" ? "status-admin" : "status-user"
                        }`}
                      >
                        {user.role === "admin" ? "관리자" : "사용자"}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <Link
                        to={""}
                        className="btn btn-sm btn-edit"
                        style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          border: "none",
                          borderRadius: "0.25rem",
                          display: "inline-block",
                        }}
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dashboard-menu">
        <div className="section-header">
          <h2>관리 메뉴</h2>
        </div>

        <div className="admin-menu-grid">
          <Link to="/admin/users" className="admin-menu-item">
            <div className="menu-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="menu-title">사용자 관리</div>
          </Link>
          <Link to="/admin/comments" className="admin-menu-item">
            <div className="menu-icon">
              <i className="bi bi-chat-dots"></i>
            </div>
            <div className="menu-title">댓글 관리</div>
          </Link>
          <Link to="/admin/contents" className="admin-menu-item">
            <div className="menu-icon">
              <i className="bi bi-grid-3x3-gap"></i>
            </div>
            <div className="menu-title">콘텐츠 관리</div>
          </Link>
          <Link to="/admin/settings" className="admin-menu-item">
            <div className="menu-icon">
              <i className="bi bi-gear"></i>
            </div>
            <div className="menu-title">사이트 설정</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
