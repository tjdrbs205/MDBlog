import { Request, Response } from "express";
import { TagService } from "./tag.service";

class TagController {
  private readonly tagService: TagService;
  constructor() {
    this.tagService = TagService.getInstance();
  }

  list = async (req: Request, res: Response) => {
    try {
      const tags = await this.tagService.getAllTags();
      res.status(200).json({
        data: tags,
      });
    } catch (error) {
      console.error("[TagController] 태그 목록 조회 중 오류:", error);
      res.status(500).json({
        message: "태그 목록 조회 중 오류가 발생했습니다.",
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      const tag = await this.tagService.createTag(name);

      res.status(201).json({
        data: tag,
      });
    } catch (error) {
      console.error("[TagController] 태그 생성 중 오류:", error);
      res.status(500).json({
        message: "태그 생성 중 오류가 발생했습니다.",
      });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const tagId = req.params.tagId;
      const { isDeletable, hasRelatePosts } = await this.tagService.checkTagDeletable(tagId);

      if (!isDeletable) {
        return res.status(400).json({
          message: "해당 태그는 삭제할 수 없습니다.",
        });
      }

      await this.tagService.deleteTag(tagId);

      res.status(200).json({
        message: "태그가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[TagController] 태그 삭제 중 오류:", error);
      res.status(500).json({
        message: "태그 삭제 중 오류가 발생했습니다.",
      });
    }
  };
}

export default TagController;
