export interface Project {
  id: string;
  name: string;
  label: string;
  path: string;
  command: string;
  group: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  projectIds: string[];
}

export interface ProjectStatus {
  name: string;
  id: string;
  group: string;
  running: boolean;
  pid: number;
}
