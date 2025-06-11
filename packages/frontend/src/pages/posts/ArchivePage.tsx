import { useEffect, useState } from "react";
import useRequest from "../../hooks/useRequest.hook";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const ArchivePage = () => {
  const location = useLocation();
  const { data, loading } = useRequest(`/posts/archive${location.search}`);

  const [searchParams] = useSearchParams();
  const selectedyear = searchParams.get("year");
  const selectedmonth = searchParams.get("month");

  useEffect(() => {}, [location, data]);

  if (loading) return <div>로딩 중...</div>;
  if (!data) return <div>데이터를 불러오지 못했습니다.</div>;

  return (
    <div className="archive-container">
      <h1 className="mb-4">게시물 아카이브</h1>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-calendar me-2" />
                연도별 보기
              </h5>
            </div>

            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {Object.keys(data.archiveByYear)
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => (
                    <li key={year} className="list-group-item">
                      <Link
                        to={`/posts/archive?year=${year}`}
                        className="text-decoration-none d-flex justify-content-between align-items-center"
                      >
                        <span>{year}년</span>
                        <span className="badge bg-primary rounded-pill">
                          {data.archiveByYear[year].reduce(
                            (sum: any, month: { count: any }) => sum + month.count,
                            0
                          )}
                        </span>
                      </Link>

                      {selectedyear && parseInt(selectedyear) === parseInt(year) && (
                        <ul className="list-unstyled ms-3 mt-2">
                          {data.archiveByYear[year].map((monthData: any) => (
                            <li key={monthData.month} className="mb-1">
                              <Link
                                to={`/posts/archive?year=${year}&month=${monthData.month}`}
                                className={`text-decoration-none d-flex justify-content-between align-items-center ${
                                  selectedmonth && parseInt(selectedmonth) === monthData.month
                                    ? "fw-bold text-primary"
                                    : ""
                                }`}
                              >
                                <span>{monthData.month}월</span>
                                <span className="badge bg-secondary rounded-pill">
                                  {monthData.count}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {selectedyear && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-file-text me-2" />
                  {selectedyear}년 {selectedmonth ? `${selectedmonth}월` : "전체"} 게시물
                  <span className="badge bg-secondary ms-2">{data.filteredPosts.length}</span>
                </h5>
              </div>

              <div className="card-body">
                {data.filteredPosts.length > 0 && (
                  <ul className="list-group list-group-flush">
                    {data.filteredPosts.map((post: any) => (
                      <li key={post.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <Link to={`/posts/${post.id}`} className="text-decoration-none">
                              <h5 className="mb-1">{post.title}</h5>
                            </Link>
                            <small className="text-muted">
                              {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              {post.author &&
                                post.author.username &&
                                ` | 작성자: ${post.author.username} 
                                 ${
                                   post.category &&
                                   post.category.name &&
                                   ` | 카테고리: ${post.category.name}`
                                 }`}
                            </small>
                          </div>
                          <span className="badge bg-light text-dark">
                            <i className="bi bi-eye me-1" />
                            {post.view || 0}
                          </span>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-2">
                            {post.tags.map((tag: any) => (
                              <Link
                                key={tag.id}
                                to={`/posts?tag=${tag.id}`}
                                className="badge bg-secondary text-decoration-none me-1"
                              >
                                {`#${tag.name} `}
                              </Link>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
