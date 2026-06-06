import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { cx } from "@/lib/utils";

type LogoVariant = "service" | "footer" | "getShelfio" | "getMark" | "getWordmark" | "labs" | "mark" | "favicon";

type LogoProps = {
  className?: string;
  href?: string;
  priority?: boolean;
  variant?: LogoVariant;
};

const logoByVariant: Record<LogoVariant, { alt: string; height: number; src: string; width: number }> = {
  service: {
    alt: "get.shelfio",
    src: "/assets/brand/shelfio-service-logo.png",
    width: 216,
    height: 50,
  },
  footer: {
    alt: "get.shelfio",
    src: "/assets/brand/get-shelfio-wordmark.png",
    width: 216,
    height: 50,
  },
  getShelfio: {
    alt: "get.shelfio",
    src: "/assets/brand/get-shelfio-wordmark.png",
    width: 216,
    height: 50,
  },
  getMark: {
    alt: ".get",
    src: "/assets/brand/get-mark.png",
    width: 180,
    height: 50,
  },
  getWordmark: {
    alt: "get.shelfio",
    src: "/assets/brand/get-wordmark.png",
    width: 180,
    height: 50,
  },
  labs: {
    alt: "Shelfio Labs",
    src: "/assets/brand/labs-wordmark.png",
    width: 180,
    height: 50,
  },
  mark: {
    alt: "Shelfio",
    src: "/assets/brand/shelfio-mark.png",
    width: 44,
    height: 44,
  },
  favicon: {
    alt: "Shelfio",
    src: "/assets/brand/favicon.png",
    width: 44,
    height: 44,
  },
};

export function Logo({ className, href = routes.home, priority = false, variant = "service" }: LogoProps) {
  const logo = logoByVariant[variant];

  return (
    <Link aria-label="Shelfio ana sayfa" className={cx("logo", `logo--${variant}`, className)} href={href}>
      <Image
        alt={logo.alt}
        height={logo.height}
        priority={priority}
        src={logo.src}
        width={logo.width}
      />
    </Link>
  );
}
