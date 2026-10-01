export type PageData<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export type AdminRow = Record<string, unknown> & {
  id: string;
  status: number;
  createdAt?: string;
};
export type AuditItem = {
  id: string;
  actorId: string;
  actorDisplayName?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string;
  summary: string;
  createdAt: string;
};
export type DashboardData = {
  totals: {
    users: number;
    groups: number;
    posts: number;
    sports: number;
    reportsPending: number;
    copyrightPending: number;
    openTasks: number;
    openIncidents: number;
  };
  activity: {
    newUsers7d: number;
    newGroups7d: number;
    newPosts7d: number;
    reports7d: number;
  };
  recentAudit: AuditItem[];
};
export type HealthData = {
  status: string;
  checkedAt: string;
  services: {
    name: string;
    status: string;
    detail: string;
  }[];
};
export type RoleData = {
  name: string;
  displayName: string;
  accessLevel: string;
  responsibilities: string[];
  permissions: string[];
  userCount: number;
};
export type Administrator = {
  id: string;
  displayName: string;
  email: string;
  status: number;
  createdAt: string;
};
