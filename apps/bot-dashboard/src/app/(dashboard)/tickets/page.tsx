import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createDb } from "@digi/db";
import { createAuth } from "@digi/auth/server";
import { and, eq } from "drizzle-orm";
import { accounts, tickets } from "@digi/db/schema";
import { env } from "~/env";
import TicketRow from "../../components/ticket-row";
import { ChevronDownIcon } from "@radix-ui/react-icons";

async function getSession() {
  const db = createDb(env.DATABASE_URL);
  const auth = createAuth({
    db,
    baseURL: env.NEXT_PUBLIC_API_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  const db = createDb(env.DATABASE_URL);

  // Find user's Discord account (provider "discord")
  const discordAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, session.user.id),
      eq(accounts.providerId, "discord"),
    ),
  });

  // accountId is the Discord user snowflake for provider "discord"
  const discordUserId = discordAccount?.accountId;

  let userTickets: (typeof tickets.$inferSelect)[] = [];

  if (discordUserId) {
    userTickets = await db.query.tickets.findMany({
      where: eq(tickets.openerDiscordUserId, discordUserId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  // Apply filters
  const statusFilter = params.status;
  const searchFilter = params.search?.toLowerCase();

  const filtered = userTickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (searchFilter) {
      const matchesNum = String(t.ticketNumber).includes(searchFilter);
      const matchesReason = t.closeReason?.toLowerCase().includes(searchFilter);
      if (!matchesNum && !matchesReason) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Your Tickets
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          View your support ticket history
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <form className="flex items-center gap-3">
          <div className="relative w-fit">
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-8 text-sm text-white outline-none focus:border-blue-500/50"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="deleted">Deleted</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>
          <input
            name="search"
            defaultValue={searchFilter ?? ""}
            placeholder="Search tickets…"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-500/20"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-neutral-500">No tickets found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="divide-y divide-white/5">
            {filtered.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
