"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import { Modal } from "~/components/modal";
import { Input } from "@digi/ui";

interface Coupon {
  id: string;
  code: string;
  type: string;
  amount: number;
  maxRedemptions: number | null;
  timesRedeemed: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", amount: "", maxRedemptions: "", expiresAt: "" });
  const [submitting, setSubmitting] = useState(false);

  async function fetchCoupons() {
    const res = await graphqlClient<{ coupons: Coupon[] }>(`
      query { coupons { id code type amount maxRedemptions timesRedeemed isActive expiresAt } }
    `);
    if (res.coupons) setCoupons(res.coupons);
  }

  useEffect(() => {
    fetchCoupons().finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setSubmitting(true);
    try {
      await graphqlClient(`
        mutation($input: CreateCouponInput!) { createCoupon(input: $input) { id } }
      `, {
        input: {
          code: form.code,
          type: form.type,
          amount: parseFloat(form.amount),
          maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
          expiresAt: form.expiresAt || null,
        },
      });
      setShowCreate(false);
      setForm({ code: "", type: "percentage", amount: "", maxRedemptions: "", expiresAt: "" });
      await fetchCoupons();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    await graphqlClient(`mutation($id: ID!) { deactivateCoupon(id: $id) { id } }`, { id });
    await fetchCoupons();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await graphqlClient(`mutation($id: ID!) { deleteCoupon(id: $id) }`, { id });
    await fetchCoupons();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Coupons</h1>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          Create Coupon
        </button>
      </div>

      <DataTable
        columns={["Code", "Type", "Amount", "Redemptions", "Status", "Expires", ""]}
        rows={coupons.map((c) => [
          <code key={c.id} className="text-sm">{c.code}</code>,
          c.type,
          c.type === "percentage" ? `${c.amount}%` : `£${(c.amount / 100).toFixed(2)}`,
          c.maxRedemptions ? `${c.timesRedeemed}/${c.maxRedemptions}` : String(c.timesRedeemed),
          c.isActive ? <span key={`s-${c.id}`} className="text-green-400">Active</span> : <span key={`s-${c.id}`} className="text-neutral-500">Inactive</span>,
          c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never",
          <div key={`a-${c.id}`} className="flex gap-2">
            {c.isActive && (
              <button onClick={() => handleDeactivate(c.id)} className="text-xs text-yellow-400 hover:text-yellow-300">Deactivate</button>
            )}
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
          </div>,
        ])}
      />

      {showCreate && (
        <Modal title="Create Coupon" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Input placeholder="Code (e.g. LAUNCH20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <Input placeholder={form.type === "percentage" ? "Amount (%)" : "Amount (pence)"} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <Input placeholder="Max redemptions (optional)" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <Input type="date" placeholder="Expires (optional)" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <button onClick={handleCreate} disabled={submitting || !form.code || !form.amount} className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {submitting ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
