"use client";

// -----------------------------------------------------------------------------
// React Query provider. Configured with sane defaults for a dashboard that
// reads mostly-stable metadata: short retry count (the API already retries
// upstream failures), no refetch-on-window-focus spam, and a moderate stale
// time so switching tabs feels instant while still staying fresh.
// -----------------------------------------------------------------------------
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
