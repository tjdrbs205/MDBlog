import { IGetPostsResponse, IPost } from "@mdblog/shared/src/types/post.interface";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import useRequestMultiple from "../../hooks/useRequestMultiple.hook";
import { useMainContext } from "../../context/MainContext";
import useRequest from "../../hooks/useRequest.hook";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { recentPosts } = useMainContext();
  const { data, loading, error } = useRequest<IGetPostsResponse>("/posts/popular");

  const handleButtonClick = (url: string) => {
    navigate(url);
  };

  if (loading) return <div>loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="container mt-4">
      {/* 화면 배너 */}
      <div className="jumbotron bg-light p-4 mb-4 rounded">
        <h1 className="display-4">환영합니다!</h1>
        <p className="lead">개발 관련 지식과 경험을 공유하는 블로그입니다.</p>
        <hr className="my-4" />
        <p>최신 개발 트렌드, 프로그래밍 팁, 프로젝트 경험 등을 나누고 있습니다.</p>
        <a
          className="btn btn-primary btn-lg"
          href="/about"
          role="button"
          onClick={(e) => {
            e.preventDefault();
            handleButtonClick("/about");
          }}
        >
          더 알아보기
        </a>
      </div>

      {/* 인기 게시물 */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>
            <i className="bi bi-star-fill text-warning me-2"></i>
            인기 게시물
          </h2>
        </div>
        <div className="row">
          {data?.posts.map((popularPost) => (
            <div key={popularPost.id} className="col-md3 mb-4">
              <div className="card h-100 shadow-sm">
                {popularPost.featuredImage ? (
                  <img
                    src={popularPost.featuredImage}
                    className="card-img-top"
                    alt={popularPost.title}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="bg-light text-center py-5">
                    <i className="bi bi-file-text display-4"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
