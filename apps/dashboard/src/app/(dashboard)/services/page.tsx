"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gql } from "~/lib/graphql";
import { ServiceCard } from "~/components/service-card";

interface Service {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gql<{ services: Service[] }>(`
      query Services {
        services {
          id
          name
          status
          subdomain
          createdAt
        }
      }
    `)
      .then((data) => {
        setServices(data.services);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your deployed microservices.</p>
        </div>
        <Link
          href="/services/new"
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          New Service
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load services: {error}
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 py-20">
          <p className="text-neutral-400">No services yet.</p>
          <Link
            href="/services/new"
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Create your first service
          </Link>
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      )}
    </div>
  );
}
