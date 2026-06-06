"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/config/navigation";
import { Icon } from "@/components/ui/Icon";

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin portal sayfaları">
      {adminNavigation.map((item) => (
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
