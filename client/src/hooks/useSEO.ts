import { useEffect } from "react";
import { useApp } from "../App.js";

function setMetaTag(attr: string, name: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO(page: "home" | "beaty" | "zvuky") {
  const { settings } = useApp() as any;

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;

    const siteName = settings["seo_site_name"] || "VOODOO808";
    const title = settings[`seo_${page}_title`] || siteName;
    const description = settings[`seo_${page}_description`] || "";
    const keywords = settings[`seo_${page}_keywords`] || "";
    const ogImage = settings["seo_og_image"] || "";

    document.title = title;

    if (description) setMetaTag("name", "description", description);
    if (keywords) setMetaTag("name", "keywords", keywords);

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:site_name", siteName);
    setMetaTag("property", "og:type", "website");
    if (description) setMetaTag("property", "og:description", description);
    if (ogImage) {
      const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${window.location.origin}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
      setMetaTag("property", "og:image", absoluteOgImage);
      setMetaTag("property", "og:image:width", "1200");
      setMetaTag("property", "og:image:height", "630");
    }
    setMetaTag("property", "og:url", window.location.href);
  }, [settings, page]);
}
