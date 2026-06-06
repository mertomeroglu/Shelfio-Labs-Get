import Link from "next/link";
import { footerNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { routes } from "@/lib/routes";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo variant="footer" />
          <p>{siteConfig.description}</p>
        </div>
        <div className="site-footer__nav">
          {footerNavigation.map((group) => (
            <div className="site-footer__group" key={group.title}>
              <h2>{group.title}</h2>
              {group.items.map((item) => (
                <Link href={item.href} key={`${group.title}-${item.href}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </Container>
      <Container className="site-footer__bottom">
        <span>© 2026 {siteConfig.companyName}</span>
        <span>
          <a href={siteConfig.companyUrl}>{siteConfig.companyDomain}</a>
          {" · "}
          <Link href={routes.contact}>{siteConfig.supportEmail}</Link>
        </span>
      </Container>
    </footer>
  );
}
