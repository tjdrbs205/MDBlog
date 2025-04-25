interface ICategory {
  id?: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  parent: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export { ICategory };
