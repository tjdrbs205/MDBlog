import { NextFunction, Request, Response } from "express";
import { SettingModel } from "../../config/models/Setting";
import { marked } from "marked";

class SettingsLoaderMiddleware {
  static async handle(req: Request, res: Response, next: NextFunction) {
    const desctription =
      "MongoDB와 Express.js를 사용한 현대적인 블로그 시스템입니다. 마크다운을 지원하고 태그와 카테고리로 콘텐츠를 관리할 수 있습니다.";

    try {
      const siteDescription = await SettingModel.getSetting("siteDescription", desctription);
      const aboutBlog = await SettingModel.getSetting(
        "aboutBlog",
        "## 안녕하세요! MDBlog에 오신 것을 환영합니다.\n\n이 블로그는 MongoDB와 Express.js를 사용하여 개발된 현대적인 블로그 시스템입니다. 개발 관련 지식과 경험을 공유하기 위한 공간입니다.\n\n### 주요 기능\n\n- 마크다운 지원으로 쉽고 빠른 글 작성\n- 카테고리와 태그를 활용한 콘텐츠 관리\n- 반응형 디자인으로 모바일 환경 지원\n\n더 많은 정보는 블로그 글을 통해 확인하세요!"
      );
      const contactGithub = await SettingModel.getSetting("contactGithub", "github.com/mdblog");
      const profileImage = await SettingModel.getSetting(
        "profileImage",
        process.env.DEFAULT_IMAGE_URL
      );
      const aboutBlogHtml = marked(aboutBlog);

      res.locals.siteDescription = siteDescription;
      res.locals.aboutBlog = aboutBlog;
      res.locals.aboutBlogHtml = aboutBlogHtml;
      res.locals.contactGithub = contactGithub;
      res.locals.profileImage = profileImage;

      next();
    } catch (error) {
      console.error("설정을 로드하는 중 오류 발생", error);
      res.locals.siteDescription = desctription;
      next();
    }
  }
}

export default SettingsLoaderMiddleware;
