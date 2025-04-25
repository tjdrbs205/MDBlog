interface IUser {
  id?: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  role: string;
  lastLogin: Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isActive: boolean;
}

export { IUser };
