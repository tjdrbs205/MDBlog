import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import useRequest from "../../hooks/useRequest.hook";
import { useEffect, useState } from "react";
import { IGetPostsResponseWithPagination } from "@mdblog/shared/src/types/post.interface";

const UserManagementPage: React.FC = () => {
  const { accessToken, refreshToken } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [managementData, setManagementData] = useState<IGetPostsResponseWithPagination | null>(
    null
  );

  const page = Number(searchParams.get("page") || 1);

  const { execute: rqeustUserManagementData } = useRequest<IGetPostsResponseWithPagination>(
    "/admin/users",
    {
      accessToken,
      manual: true,
      params: {
        page: page,
      },
      onTokenRefresh: refreshToken,
    }
  );

  useEffect(() => {
    rqeustUserManagementData().then((res) => {
      if (res.error) {
        console.error("사용자 관리 데이터 로드 실패:");
      }
      setManagementData(res.data);
    });
  }, [searchParams]);

  if (!managementData) {
    return <div>사용자 관리 데이터를 불러오는 중...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">사용자 관리</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>이메일</th>
                      <th>생성일</th>
                      <th>현재 권한</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managementData.users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.role === "admin" ? "bg-danger" : "bg-primary"
                            }`}
                          >
                            {user.role === "admin" ? "관리자" : "사용자"}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <nav aria-label="Page navigation">
                  <ul className="pagination justify-content-center">
                    {Array.from(
                      { length: managementData.pagination.totalPages },
                      (_, i) => i + 1
                    ).map((i) => (
                      <li
                        key={i}
                        className={`page-item ${
                          managementData.pagination.page === i ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setSearchParams({ page: `${i}` })}
                        >
                          {i}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
