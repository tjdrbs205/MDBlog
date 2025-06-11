import { Request, Response } from "express";
import AdminService from "./admin.service";
import { SettingModel } from "../../../config/models/Setting";
import {
  deleteBlogProfileImage,
  uploadBlogProfileImage,
} from "../../../common/utils/cloudinary.util";
import UserService from "../../user/v1/user.service";
import PostService from "../../post/v1/post.service";

class AdminController {
  private readonly adminService: AdminService;
  private readonly userService: UserService;
  private readonly postService: PostService;
  constructor() {
    this.adminService = AdminService.getInstance();
    this.userService = UserService.getInstance();
    this.postService = PostService.getInstance();
  }

  getDashboardInitData = async (req: Request, res: Response) => {
    try {
      const statsData = await this.adminService.getDashboardData();

      if (!statsData) {
        return res.status(404).json({
          message: "대시보드 초기 데이터를 가져오는 데 실패했습니다.",
        });
      }

      res.status(200).json({
        ...statsData,
      });
    } catch (error) {
      console.error("[AdminController] 대시보드 초기 데이터 가져오기 중 오류", error);
      res.status(500).json({
        message: "대시보드 초기 데이터 가져오기 중 오류가 발생했습니다.",
      });
    }
  };

  getUserManagementData = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;

      const { users, totalUsers, pagination } = await this.adminService.getUserWithPagination(
        page,
        limit
      );

      res.status(200).json({
        users,
        totalUsers,
        pagination,
      });
    } catch (error) {
      console.error("[AdminController] 사용자 관리 데이터 가져오기 중 오류", error);
      res.status(500).json({
        message: "사용자 관리 데이터 가져오기 중 오류가 발생했습니다.",
      });
    }
  };

  getSettingsData = async (req: Request, res: Response) => {
    try {
      const settingsData = await this.adminService.getSettings();

      if (!settingsData) {
        return res.status(404).json({
          message: "설정 데이터를 가져오는 데 실패했습니다.",
        });
      }
      res.status(200).json({
        ...settingsData,
      });
    } catch (error) {
      console.error("[AdminController] 설정 데이터 가져오기 중 오류", error);
      res.status(500).json({
        message: "설정 데이터 가져오기 중 오류가 발생했습니다.",
      });
    }
  };

  updateUserStatus = async (req: Request, res: Response) => {
    try {
      const { userId, isActive } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: "사용자 ID가 필요합니다.",
        });
      }

      if (userId === req.user?.id) {
        return res.status(400).json({
          message: "자신의 상태는 변경할 수 없습니다.",
        });
      }

      const user = await this.adminService.updateUserStatus(userId, isActive === "true");

      res.status(201).json({ message: "업데이트 되었습니다." });
    } catch (error) {
      console.error("[AdminController] 사용자 상태 변경 중 오류:", error);
      res.status(500).json({
        message: "사용자 상태 변경 중 오류가 발생했습니다.",
      });
    }
  };

  updateUserRole = async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: "사용자의 ID가 필요합니다.",
        });
      }

      if (userId === req.user?.id) {
        return res.status(400).json({
          message: "자신의 역할은 변경할 수 없습니다.",
        });
      }

      const user = await this.adminService.updateUserRole(userId, role);

      res.status(201).json({ message: "업데이트 되었습니다." });
    } catch (error) {
      console.error("[AdminController] 사용자 역학 변경 중 오류", error);
      res.status(500).json({
        message: "사용자 역할 변경 중 오류가 발생햇습니다.",
      });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      if (!req.user) {
        return res.status(401).json({
          message: "사용자를 찾을 수 없습니다.",
        });
      }

      if (userId === req.user.id) {
        return res.status(400).json({
          message: "자신의 계정은 삭제할 수 없습니다.",
        });
      }

      await this.userService.deleteUser(userId);

      res.status(200).json({
        message: "삭제되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 사용자 삭제 중 오류", error);
      res.status(500).json({
        message: "사용자 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      await this.postService.deletePost(postId);
      res.status(200).json({
        message: "게시물이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 게시물 삭제 중 오류", error);
      res.status(500).json({
        menubar: "게시물 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  deleteComment = async (req: Request, res: Response) => {
    try {
      const { postId, commentId } = req.params;

      await this.postService.deleteComment(postId, commentId);

      res.status(200).json({
        message: "댓글이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 댓글 삭제 중 오류", error);
      res.status(500).json({
        message: "댓글 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  saveSettings = async (req: Request, res: Response) => {
    const defaultProfileImage =
      "https://github.com/tjdrbs205/MDBlog/blob/main-backup/public/images/default-profile.png?raw=true";

    try {
      const { siteDescription, aboutBlog, contactEmail, contactGithub, currentBlogProfileImage } =
        req.body;
      const blogProfileImage = req.file?.buffer;

      if (currentBlogProfileImage === defaultProfileImage) await deleteBlogProfileImage();
      if (blogProfileImage) {
        await uploadBlogProfileImage(blogProfileImage);
      }

      const settings: Record<string, any> = {
        siteDescription: siteDescription || "",
        aboutBlog: aboutBlog || "",
        contactEmail: contactEmail || "",
        contactGithub: contactGithub || "",
      };

      for (const [key, value] of Object.entries(settings)) {
        await SettingModel.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
      }

      res.status(200).json({
        message: "설정이 저장되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 설정 저장 중 오류", error);
      res.status(500).json({
        message: "설정 저장 중 오류가 발생했습니다.",
      });
    }
  };

  uploadProfileImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "업로드할 이미지를 선택해주세요",
        });
      }

      await uploadBlogProfileImage(req.file.buffer);

      res.status(200).json({
        message: "프로필 이미지가 업로드되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 프로필 아마자 업로드 중 오류", error);
      res.status(500).json({
        message: "프로필 이미지 업로드 중 오류가 발생했습니다.",
      });
    }
  };

  deleteProfileImage = async (req: Request, res: Response) => {
    try {
      await deleteBlogProfileImage();

      res.status(200).json({
        message: "프로필 이미지가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[AdminController] 프로필 이미지 삭제 중 오류", error);
      res.status(500).json({
        message: "프로필 이미지 삭제 중 오류가 발생했습니다.",
      });
    }
  };
}

export default AdminController;
