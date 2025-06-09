interface ISetting {
  id: string;
  key: string;
  value: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ISettingData {
  aboutBlog: string;
  contactEmail: string;
  contactGithub: string;
  profileImage: string;
  siteDescription: string;
}

export { ISetting, ISettingData };
