import { ITag } from "@mdblog/shared/src/types/tag.interface";
import { TagModel } from "../model/tag.model";
import { PostModel } from "../../post/model/post.model";
import { SortOrder } from "mongoose";

class TagService {
  private static instance: TagService;

  private constructor() {}

  // 싱글톤 패턴
  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  async getAllTags(options: { sort: Record<string, SortOrder> }): Promise<ITag[]> {
    const { sort = { name: 1 } } = options;
    return (await TagModel.find().sort(sort)).map((tag) => {
      return tag.plainTag;
    });
  }

  async getTagById(tagId: string): Promise<ITag> {
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      const error = new Error("태그를 찾을 수 없습니다.");
      throw error;
    }

    return tag.plainTag;
  }

  async getTagByName(tagName: string): Promise<ITag> {
    const tag = await TagModel.findOne({ name: tagName.toLowerCase() });
    if (!tag) {
      const error = new Error("태그를 찾을 수 없습니다.");
      throw error;
    }
    return tag.plainTag;
  }

  async createTag(tagName: string): Promise<ITag> {
    // 태그 이름이 없는 경우 예외 처리
    if (!tagName || tagName.trim()) {
      const error = new Error("태그 이름은 필수입니다.");
      throw error;
    }

    // 이름 중복 검사
    const curTagName = tagName.trim().toLowerCase();
    const existingTag = await TagModel.findOne({ name: curTagName });

    // 이미 존재하는 태그인 경우 기존 태그 반환
    if (existingTag) {
      return existingTag.plainTag;
    }

    const newTag = await TagModel.create({ name: tagName });
    return newTag.plainTag;
  }

  async checkTagDeletable(tagId: string): Promise<{
    isDeletable: boolean;
    hasRelatePosts: { _id: unknown } | null;
    tag: ITag;
  }> {
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      const error = new Error("태그를 찾을 수 없습니다.");
      throw error;
    }

    const hasRelatePosts = await PostModel.exists({ tags: tagId });

    return {
      isDeletable: !hasRelatePosts,
      hasRelatePosts,
      tag: tag.plainTag,
    };
  }

  async deleteTag(tagId: string): Promise<ITag> {
    const { isDeletable, hasRelatePosts } = await this.checkTagDeletable(tagId);
    if (!isDeletable) {
      const error = new Error("이 태그를 사용하는 게시물이 있어 삭제 할 수 없습니다.");
      throw error;
    }

    const deletedTag = await TagModel.findByIdAndDelete(tagId);
    if (!deletedTag) {
      const error = new Error("카테고리 삭제에 실패했습니다.");
      throw error;
    }
    return deletedTag.plainTag;
  }
}

export { TagService };
