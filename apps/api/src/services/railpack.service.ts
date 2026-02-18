// Railpack integration for building GitHub repos into Docker images.
// Railpack is used as a buildpack alternative to convert source code
// into OCI-compliant Docker images.

export interface RailpackBuildOptions {
  vmIp: string;
  repoUrl: string;
  branch: string;
  imageName: string;
  envVars?: Record<string, string>;
}

export async function buildWithRailpack(
  opts: RailpackBuildOptions
): Promise<string> {
  // Clone the repo on the VM
  const cloneCmd = `cd /tmp && rm -rf build-${opts.imageName} && git clone --branch ${opts.branch} --depth 1 ${opts.repoUrl} build-${opts.imageName}`;

  const proc1 = Bun.spawn(
    ["ssh", "-o", "StrictHostKeyChecking=no", `root@${opts.vmIp}`, cloneCmd],
    { stdout: "pipe", stderr: "pipe" }
  );
  await proc1.exited;

  // Build with Railpack
  // Railpack detects the framework and creates a Docker image
  const buildCmd = `cd /tmp/build-${opts.imageName} && railpack build --name ${opts.imageName}`;

  const proc2 = Bun.spawn(
    ["ssh", "-o", "StrictHostKeyChecking=no", `root@${opts.vmIp}`, buildCmd],
    { stdout: "pipe", stderr: "pipe" }
  );

  const exitCode = await proc2.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc2.stderr).text();
    throw new Error(`Railpack build failed: ${stderr}`);
  }

  return opts.imageName;
}
