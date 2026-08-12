import type { Metadata } from "next";

import {
  getSiteUrl,
  ICON_ASSET_PATHS,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "./site";

/**
 * Suggested page titles for child routes.
 * With the root `title.template` ("%s | Alcaster"), exporting
 * `metadata: { title: PAGE_TITLES.dashboard }` yields "Dashboard | Alcaster".
 */
export const PAGE_TITLES = {
  dashboard: "Dashboard",
  projects: "Projects",
  createPlant: "Create Plant",
  plantOverview: "Plant Overview",
  digitalTwin: "Digital Twin",
  plantBuilder: "Plant Builder",
  analytics: "Analytics",
  alerts: "Alerts",
  simulation: "Simulation",
  settings: "Settings",
} as const;

export type PageTitleKey = keyof typeof PAGE_TITLES;

const publicRobots: Metadata["robots"] = {
  index: true,
  follow: true,
};

const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

type PageMetadataOptions = {
  /** Page-specific description; falls back to the product description. */
  description?: string;
  /** Absolute path or full URL for canonical; defaults to site root for public pages. */
  canonicalPath?: string;
  /** Mark authenticated / private application pages as noindex. */
  robots?: "public" | "private";
};

/**
 * Root metadata for the marketing / public entry point.
 * Child pages should use `createPageMetadata` (or export a `title` string)
 * so the template produces "[Page Title] | Alcaster".
 */
export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    generator: "Next.js",
    category: "technology",
    classification: "Renewable Energy / Digital Twin Software",
    keywords: [...SITE_KEYWORDS],
    robots: publicRobots,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: "en_US",
      url: siteUrl,
      // Add `public/og-image.png` to enable social preview images.
      images: [
        {
          url: OG_IMAGE_PATH,
          alt: SITE_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: [
        {
          url: ICON_ASSET_PATHS.light,
          type: "image/svg+xml",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: ICON_ASSET_PATHS.dark,
          type: "image/svg+xml",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      shortcut: ICON_ASSET_PATHS.light,
      apple: ICON_ASSET_PATHS.apple,
    },
  };
}

/**
 * Page-level metadata that inherits the root title template and product defaults.
 *
 * @example
 * // app/(app)/dashboard/page.tsx
 * export const metadata = createPageMetadata(PAGE_TITLES.dashboard, {
 *   robots: "private",
 * });
 * // → title: "Dashboard | Alcaster", robots: noindex
 */
export function createPageMetadata(
  title: string,
  options: PageMetadataOptions = {},
): Metadata {
  const {
    description = SITE_DESCRIPTION,
    canonicalPath,
    robots = "public",
  } = options;

  const isPrivate = robots === "private";

  return {
    title,
    description,
    robots: isPrivate ? privateRobots : publicRobots,
    ...(canonicalPath && !isPrivate
      ? { alternates: { canonical: canonicalPath } }
      : {}),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(canonicalPath ? { url: canonicalPath } : {}),
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

/** Convenience helper for authenticated application routes. */
export function createPrivatePageMetadata(
  title: string,
  options: Omit<PageMetadataOptions, "robots"> = {},
): Metadata {
  return createPageMetadata(title, { ...options, robots: "private" });
}
