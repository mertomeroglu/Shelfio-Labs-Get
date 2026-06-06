"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/config/navigation";
import { routes } from "@/lib/routes";
import { cx } from "@/lib/utils";
import { HeaderAuthLink } from "@/components/auth/HeaderAuthLink";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Container className="site-header__inner">
        <Logo priority variant="getShelfio" />
        <nav aria-label="Ana navigasyon" className="site-header__nav">
          {primaryNavigation.map((item) => (
            <Link
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={cx(isActivePath(pathname, item.href) && "is-active")}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <Button href={routes.demo} size="sm">
            Demo Talep Et
          </Button>
          <HeaderAuthLink />
        </div>
        <Button className="site-header__mobile-cta" href={routes.demo} size="sm">
          Demo Talep Et
        </Button>
        <MobileMenu />
      </Container>
    </header>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
