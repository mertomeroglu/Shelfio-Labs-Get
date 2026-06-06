"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { primaryNavigation } from "@/config/navigation";
import { routes } from "@/lib/routes";
import { cx } from "@/lib/utils";
import { HeaderAuthLink } from "@/components/auth/HeaderAuthLink";
import { Button } from "@/components/ui/Button";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="mobile-menu">
      <button
        aria-expanded={open}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        className="mobile-menu__toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <div className="mobile-menu__panel">
          {primaryNavigation.map((item) => (
            <Link
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={cx(isActivePath(pathname, item.href) && "is-active")}
              href={item.href}
              key={item.href}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          <HeaderAuthLink onNavigate={closeMenu} />
          <Button href={routes.demo} onClick={closeMenu} size="sm">
            Demo Talep Et
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
