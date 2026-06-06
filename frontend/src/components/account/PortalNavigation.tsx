"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNavigation } from "@/config/navigation";
import { Icon } from "@/components/ui/Icon";

export function PortalNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Müşteri portalı sayfaları">
      {accountNavigation.map((item) => (
        <Link
          aria-current={pathname === item.href ? "page" : undefined}
          className={pathname === item.href ? "is-active" : undefined}
          href={item.href}
          key={item.href}
        >
          {item.icon ? <Icon className="account-sidebar__icon" name={item.icon} /> : null}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
