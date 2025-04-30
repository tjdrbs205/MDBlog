interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string | "";
  order: number;
  parent?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ICategoryWithChildren extends ICategory {
  children: ICategory[];
}

export { ICategory, ICategoryWithChildren };
