import type { IconName } from "@/components/ui/Icon";

export type NavigationItem = {
  label: string;
  href: string;
  icon?: IconName;
};

export type FooterGroup = {
  title: string;
  items: NavigationItem[];
};
