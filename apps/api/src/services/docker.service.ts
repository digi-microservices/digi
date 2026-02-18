// Docker operations are performed over SSH to the target VM.
// In production, this would use an SSH library (e.g., ssh2) or
// the Docker Engine API over a forwarded socket.

export interface DockerRunOptions {
  image: string;
  name: string;
  envVars: Record<string, string>;
  ports: Array<{ host: number; container: number }>;
  memory?: string;
  cpus?: string;
  storage?: string;
  network?: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  status: string;
  image: string;
  ports: string;
}

async function sshExec(vmIp: string, command: string): Promise<string> {
  // In production, use ssh2 library or Docker API over HTTP
  // For now, use Bun's subprocess
  const proc = Bun.spawn(["ssh", "-o", "StrictHostKeyChecking=no", `root@${vmIp}`, command], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`SSH command failed: ${stderr}`);
  }
  return stdout.trim();
}

export async function pullImage(vmIp: string, image: string): Promise<void> {
  await sshExec(vmIp, `docker pull ${image}`);
}

export async function runContainer(
  vmIp: string,
  opts: DockerRunOptions
): Promise<string> {
  const envFlags = Object.entries(opts.envVars)
    .map(([k, v]) => `-e ${k}=${v}`)
    .join(" ");
  const portFlags = opts.ports
    .map((p) => `-p ${p.host}:${p.container}`)
    .join(" ");
  const resourceFlags = [
    opts.memory ? `--memory=${opts.memory}` : "",
    opts.cpus ? `--cpus=${opts.cpus}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cmd = `docker run -d --name ${opts.name} ${envFlags} ${portFlags} ${resourceFlags} --restart unless-stopped ${opts.image}`;
  return sshExec(vmIp, cmd);
}

export async function stopContainer(
  vmIp: string,
  containerId: string
): Promise<void> {
  await sshExec(vmIp, `docker stop ${containerId}`);
}

export async function restartContainer(
  vmIp: string,
  containerId: string
): Promise<void> {
  await sshExec(vmIp, `docker restart ${containerId}`);
}

export async function removeContainer(
  vmIp: string,
  containerId: string
): Promise<void> {
  await sshExec(vmIp, `docker rm -f ${containerId}`);
}

export async function getContainerLogs(
  vmIp: string,
  containerId: string,
  follow: boolean = false
): Promise<string> {
  const followFlag = follow ? "-f" : "--tail 100";
  return sshExec(vmIp, `docker logs ${followFlag} ${containerId}`);
}

export async function inspectContainer(
  vmIp: string,
  containerId: string
): Promise<Record<string, unknown>> {
  const output = await sshExec(
    vmIp,
    `docker inspect ${containerId}`
  );
  return JSON.parse(output)[0];
}

export async function listContainers(
  vmIp: string
): Promise<DockerContainer[]> {
  const output = await sshExec(
    vmIp,
    `docker ps --format '{"id":"{{.ID}}","name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}","ports":"{{.Ports}}"}'`
  );
  if (!output) return [];
  return output.split("\n").map((line) => JSON.parse(line));
}
