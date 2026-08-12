import type { Metadata } from "next";

/**
 * Route group for authenticated / private application pages.
 *
 * Place private routes under `src/app/(app)/...` so they inherit noindex
 * by default. Override per page with `createPrivatePageMetadata` /
 * `createPageMetadata` from `@/lib/metadata` when needed.
 *
 * Example:
 *   src/app/(app)/dashboard/page.tsx
 *   export const metadata = createPrivatePageMetadata("Dashboard");
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
