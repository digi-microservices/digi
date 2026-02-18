export type ServerStatus = "active" | "maintenance" | "offline";

export type VmStatus =
  | "provisioning"
  | "running"
  | "stopped"
  | "error"
  | "destroying";

export interface VmStats {
  vmId: string;
  cpuUsage: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  containerCount: number;
  uptime: number;
}

export interface ProxmoxNodeInfo {
  id: string;
  name: string;
  hostname: string;
  status: ServerStatus;
  vmCount: number;
  maxVms: number;
  cpuCores?: number;
  ramGb?: number;
  storageTb?: number;
}
