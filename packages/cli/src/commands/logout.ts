import { removeConfig } from "../lib/config";
import { success, info } from "../lib/output";

export async function logoutCommand(_args: string[]): Promise<void> {
  const removed = removeConfig();

  if (removed) {
    success("Logged out successfully. Credentials removed.");
  } else {
    info("No credentials found. Already logged out.");
  }
}
