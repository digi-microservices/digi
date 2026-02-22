// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://api.localhost";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const upstream =
    pathStr === "graphql"
      ? `${API_URL}/graphql`
      : `${API_URL}/api/auth/${pathStr}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  // Forward all cookies from the browser
  const cookieHeader = req.cookies.toString();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  try {
    const response = await fetch(upstream, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error - duplex required for streaming body
      duplex: "half",
    });

    // Build response headers WITHOUT Set-Cookie (we handle those separately)
    const resHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") continue;
      if (key.toLowerCase() === "content-encoding") continue;
      if (key.toLowerCase() === "transfer-encoding") continue;
      resHeaders.set(key, value);
    }

    const res = new NextResponse(response.body, {
      status: response.status,
      headers: resHeaders,
    });

    // Properly forward Set-Cookie headers one-by-one
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      res.headers.append("set-cookie", cookie);
    }

    return res;
  } catch (err) {
    console.error("[proxy] error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
