"use client";

import { useEffect } from "react";

const canonicalOrigin = "https://getshelfio.com";
const wwwHostname = "www.getshelfio.com";

export function CanonicalHostRedirect() {
  useEffect(() => {
    if (window.location.hostname !== wwwHostname) return;

    const { hash, pathname, search } = window.location;
    window.location.replace(`${canonicalOrigin}${pathname}${search}${hash}`);
  }, []);

  return null;
}
