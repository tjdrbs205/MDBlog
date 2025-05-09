interface ISetting {
  id: string;
  key: string;
  value: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export { ISetting };
