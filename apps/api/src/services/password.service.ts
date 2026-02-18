import { eq } from "drizzle-orm";
import { accounts, users, auditLogs } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { generateId } from "@digi/shared/utils";

function generateSecurePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export async function rotateAdminPassword(db: Database): Promise<void> {
  const adminUsers = await db.query.users.findMany({
    where: eq(users.role, "admin"),
  });

  for (const admin of adminUsers) {
    const newPassword = generateSecurePassword();
    const hashedPassword = await Bun.password.hash(newPassword, "bcrypt");

    // Update the admin's credential account password
    await db
      .update(accounts)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(accounts.userId, admin.id));

    // Log the plaintext password — only visible in server logs
    console.log(
      `[ADMIN PASSWORD ROTATION] Admin "${admin.email}" new password: ${newPassword}`
    );

    // Audit log
    await db.insert(auditLogs).values({
      id: generateId(),
      actorType: "system",
      action: "admin.password_rotate",
      resourceType: "user",
      resourceId: admin.id,
    });
  }
}

export function startPasswordRotation(db: Database): void {
  // Rotate every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  setInterval(() => {
    rotateAdminPassword(db).catch((err) => {
      console.error("[PASSWORD ROTATION ERROR]", err);
    });
  }, TWENTY_FOUR_HOURS);

  console.log("[PASSWORD ROTATION] Scheduled every 24 hours");
}
