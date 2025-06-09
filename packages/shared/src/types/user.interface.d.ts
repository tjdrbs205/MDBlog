interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  bio: string;
  role: string;
  lastLogin: Date;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
}

interface IRegisterUser {
  username: string;
  email: string;
  password: string;
}

interface ILoginUser {
  email: string;
  password: string;
}

interface IReadOnlyUser extends Omit<IUser, "password"> {}

export { IUser, IReadOnlyUser, IRegisterUser, ILoginUser };
