type ModuleIconProps = {
  name?: string;
};

const iconPathByName: Record<string, string> = {
  ST: "M20 7.5 12 3 4 7.5m16 0-8 4.5m8-4.5v9L12 21m0-9L4 7.5m8 4.5v9M4 7.5v9L12 21",
  POS: "M7 7h14l-2 8H8L7 7Zm0 0H4m5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM9 11h8",
  SA: "M3 7h11v8H3V7Zm11 3h3l3 3v2h-6v-5ZM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  "SÖ": "M12 3v4m0 10v4m9-9h-4M7 12H3m15.4-6.4-2.8 2.8M8.4 15.6l-2.8 2.8m12.8 0-2.8-2.8M8.4 8.4 5.6 5.6M12 8l1.2 2.5L16 11l-2 2 0.5 3-2.5-1.4L9.5 16l0.5-3-2-2 2.8-.5L12 8Z",
  DR: "M4 20V8l8-5 8 5v12M7 20v-8h10v8M9 14h2m2 0h2m-6 3h2m2 0h2",
  RP: "M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7m4 7v-3",
  ESL: "M4 7h16v10H4V7Zm3 3h5m-5 4h8m3-4h.01M8 20h8",
  MO: "M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 15h2",
  FT: "M4 18 9 9l4 4 7-9m-5 0h5v5",
  KY: "M4 7h16M6 7l1 13h10l1-13M9 7V5a3 3 0 0 1 6 0v2m-6 6h6",
  GP: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  PM: "M7 4h10v16H7V4Zm4 13h2M9 7h6",
  MM: "M8 10a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm-4 11a8 8 0 0 1 16 0",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-7 9 7 4 7-4M5 16l7 4 7-4",
  "file-text": "M14 3v5h5M7 13h10M7 17h7M6 3h8l5 5v13H6V3Z",
  key: "M15 7a4 4 0 1 1-2.8 6.8L9 17H6v3H3v-3.2l5.2-5.2A4 4 0 0 1 15 7Z",
  "credit-card": "M3 6h18v12H3V6Zm0 4h18M7 15h3m2 0h5",
  store: "M4 10h16l-1-5H5l-1 5Zm2 0v10h12V10M9 20v-6h6v6M5 10a3 3 0 0 0 6 0m2 0a3 3 0 0 0 6 0",
  "shield-check": "M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-5",
  workflow: "M5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 7v3a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4v-1M9 14l3-3m0 0 3 3m-3-3v7",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.8M16 3.2a4 4 0 0 1 0 7.6",
  "external-link": "M14 4h6v6m0-6-9 9M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5",
  database: "M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  "layout-dashboard": "M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9-3h7v10h-7V10Z",
};

export function ModuleIcon({ name }: ModuleIconProps) {
  const path = iconPathByName[name ?? ""] ?? iconPathByName.ST;

  return (
    <span className="feature-card__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d={path} />
      </svg>
    </span>
  );
}
