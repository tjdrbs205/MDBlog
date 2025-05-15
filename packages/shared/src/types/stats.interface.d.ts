interface IStats {
  id: string;
  date: Date;
  visits: number;
  uniqueVisitors?: number;
  pageViews?: number;
  pages?: Map<string, number>;
  regions?: Map<string, number>;
  browsers?: Map<string, number>;
}

export { IStats };
