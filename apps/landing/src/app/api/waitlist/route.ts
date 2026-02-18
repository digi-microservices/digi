import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { waitlist } from "~/server/db/schema";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { email } = emailSchema.parse(body);

    await db.insert(waitlist).values({ email });

    return NextResponse.json(
      { success: true, message: "Added to waitlist!" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message },
        { status: 400 }
      );
    }

    // Handle duplicate email (PostgreSQL unique constraint)
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    console.error("Waitlist error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
