"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@/types/tenant";
import { getCurrentUser } from "@/services/authService";
import { routes } from "@/lib/routes";
import { cx } from "@/lib/utils";

export function HeaderAuthLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((currentUser) => {
      if (mounted) {
        setUser(currentUser);
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const portalHref =
    user?.role === "admin"
      ? routes.admin
      : user?.role === "customer"
        ? routes.account
        : routes.login;

  const portalLabel =
    user?.role === "admin"
      ? "Admin Paneli"
      : user?.role === "customer"
        ? "Hesabım"
        : "Giriş Yap";

  const firstName = user?.name?.split(" ")[0] ?? null;

  // Don't show the link until auth has resolved to avoid the "Giriş Yap" flash
  if (!loaded) {
    return (
      <span className="site-header__login site-header__login--skeleton" aria-hidden="true">
        <span className="site-header__login-icon">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          </svg>
        </span>
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        aria-current={isActivePath(pathname, routes.login) ? "page" : undefined}
        className={cx("site-header__login", isActivePath(pathname, routes.login) && "is-active")}
        href={routes.login}
        onClick={onNavigate}
      >
        <span className="site-header__login-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          </svg>
        </span>
        Giriş Yap
      </Link>
    );
  }

  return (
    <div
      className="header-user-menu"
      ref={menuRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        aria-current={isActivePath(pathname, portalHref) ? "page" : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        className={cx("site-header__login header-user-menu__trigger", isActivePath(pathname, portalHref) && "is-active")}
        href={portalHref}
        onClick={onNavigate}
      >
        <span className="site-header__login-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          </svg>
        </span>
        <span className="header-user-menu__label">
          {firstName ?? portalLabel}
        </span>
      </Link>

      {open && (
        <div className="header-user-menu__dropdown" role="menu">
          <div className="header-user-menu__info">
            <strong>{user.name}</strong>
            {user.tenant?.name ? <span>{user.tenant.name}</span> : null}
            <small>{user.role === "admin" ? "Yönetici" : "Müşteri"}</small>
          </div>
          <Link
            className="header-user-menu__portal-link"
            href={portalHref}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            {portalLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
