import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, wsLink, splitLink, createWSClient } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getEndingLink = () => {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: `http://localhost:3000/api/trpc`,
      transformer: superjson,
    });
  }

  const client = createWSClient({
    url: `ws://localhost:3000/api/trpc`,
  });

  return splitLink({
    condition: (op) => op.type === "subscription",
    true: wsLink({ client, transformer: superjson }),
    false: httpBatchLink({
      url: `/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  });
};

export const trpcClient = trpc.createClient({
  links: [getEndingLink()],
});
