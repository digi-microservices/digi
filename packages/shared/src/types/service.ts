export type ServiceStatus =
  | "created"
  | "deploying"
  | "running"
  | "stopped"
  | "error"
  | "destroying";

export type ContainerType = "app" | "postgres" | "redis" | "docker";

export type ContainerStatus =
  | "pending"
  | "creating"
  | "running"
  | "stopped"
  | "error"
  | "destroying";

export type DeploymentStatus =
  | "queued"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "rolled_back";

export type SourceType = "github" | "docker";

export type JobType = "deploy" | "destroy" | "scale" | "build";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retrying";

export interface LogLine {
  timestamp: string;
  message: string;
  stream: "stdout" | "stderr";
  containerId: string;
}

export interface DeploymentEvent {
  jobId: string;
  status: DeploymentStatus;
  message: string;
  timestamp: string;
  progress?: number;
}
