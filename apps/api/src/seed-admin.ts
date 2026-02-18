import { createDb } from "@digi/db";
import { users, accounts } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const db = createDb(DATABASE_URL);

async function seedAdmin() {
  const email = process.argv[2] ?? "admin@digi.dev";
  const name = process.argv[3] ?? "Admin";

  // Generate a secure password
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const password = Array.from(array, (byte) => chars[byte % chars.length]).join("");

  const hashedPassword = await Bun.password.hash(password, "bcrypt");
  const userId = generateId();

  // Create admin user
  await db.insert(users).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    role: "admin",
  });

  // Create credential account
  await db.insert(accounts).values({
    id: generateId(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
  });

  console.log("========================================");
  console.log("Admin user created successfully!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("========================================");
  console.log("IMPORTANT: Save this password now. It will rotate in 24 hours.");
  console.log("After rotation, check server logs for the new password.");

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
