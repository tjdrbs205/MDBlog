import { IReadOnlyUser } from "@mdblog/shared/src/types/user.interface";
import { UserModel } from "../model/user.model";
import bcrypt from "bcrypt";

class UserService {
  private static instance: UserService;
  private constructor() {}

  // 싱글톤 패턴
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  //사용자 등록
  async registerUser(username: string, email: string, password: string): Promise<IReadOnlyUser> {
    // 이메일 중복 체크
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      const error = new Error("이미 사용 중인 이메일입니다.");
      throw error;
    }

    // 사용자명 중복 체크
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      const error = new Error("이미 사용 중인 사용자명입니다.");
      throw error;
    }

    // 사용자 생성
    const user = await UserModel.create({
      username,
      email,
      password,
    });

    return user.readOnlyUser;
  }

  // 비밀번호 변경
  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<IReadOnlyUser> {
    // 사용자 조회
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("사용자를 찾을 수 없습니다.");
      throw error;
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("현재 비밀번호가 일치하지 않습니다.");
      throw error;
    }

    // 새 비밀번화 현재 비밀번호가 일치하는지 확인
    if (currentPassword === newPassword) {
      const error = new Error("현재 사용하는 비밀번호와 같습니다.");
      throw error;
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    user.password = hashedPassword;
    await user.save();

    return user.readOnlyUser;
  }

  // 프로필 업데이트
  async updateUserProfile(userId: string, username: string, bio: string): Promise<IReadOnlyUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("사용자를 찾을 수 없습니다.");
      throw error;
    }

    // 사용자 필드 업데이트
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;

    user.updatedAt = new Date();
    await user.save();

    return user.readOnlyUser;
  }

  // 사용자 ID로 조회
  async getUserById(userId: string): Promise<IReadOnlyUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("사용자를 찾을 수 없습니다.");
      throw error;
    }

    return user.readOnlyUser;
  }
}

export default UserService;
