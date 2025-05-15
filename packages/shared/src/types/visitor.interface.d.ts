interface IVisitor {
  id: string;
  visitorId: string;
  ip: string;
  userAgent: string;
  lastVisit: Date;
  visitCount: number;
  firstVisit: Date;
  region: string;
  lastPath: string;
  browser: string;
  visitedPages: {
    path: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IVisitorIncrement
  extends Pick<IVisitor, "visitorId" | "ip" | "userAgent"> {
  region?: string;
  browser?: string;
  path: string;
  isDuplicate: boolean;
}

interface IVisitorsActive {
  id: string;
  time: Date;
  path: string;
  browser: string;
  region: string;
}

export { IVisitor, IVisitorsActive, IVisitorIncrement };
