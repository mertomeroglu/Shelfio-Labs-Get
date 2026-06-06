import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "billing"
  | "building"
  | "dashboard"
  | "email"
  | "headset"
  | "key"
  | "license"
  | "map-pin"
  | "phone"
  | "plus"
  | "search"
  | "settings"
  | "shield"
  | "store"
  | "user"
  | "users";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<IconName, ReactNode> = {
  billing: (
    <>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 8h2a2 2 0 0 1 2 2v11" />
      <path d="M3 21h18" />
      <path d="M8 7h4" />
      <path d="M8 11h4" />
      <path d="M8 15h4" />
    </>
  ),
  dashboard: (
    <>
      <rect height="8" rx="2" width="8" x="3" y="3" />
      <rect height="8" rx="2" width="8" x="13" y="3" />
      <rect height="8" rx="2" width="8" x="3" y="13" />
      <rect height="8" rx="2" width="8" x="13" y="13" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      <path d="M16 21h-4" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="14.5" r="3.5" />
      <path d="m10 12 8-8" />
      <path d="m15 7 2 2" />
      <path d="m17 5 2 2" />
    </>
  ),
  license: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M7 8h6" />
      <path d="M7 12h10" />
      <path d="M7 16h4" />
    </>
  ),
  email: (
    <>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92Z" />
    </>
  ),
  plus: (
    <>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.25.33.44.67.6 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-.51 1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  store: (
    <>
      <path d="M4 10h16l-1-5H5l-1 5Z" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M17 11a4 4 0 1 0-1-7.87" />
      <path d="M22 21a7 7 0 0 0-5-6.7" />
    </>
  ),
};
