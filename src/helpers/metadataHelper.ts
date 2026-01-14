const upsertMetaTag = (
  kind: "name" | "property",
  key: string,
  content: string
): (() => void) => {
  if (typeof document === "undefined") return () => {};

  const head = document.head;
  const selector = `meta[${kind}="${CSS.escape(key)}"]`;
  const existing = head.querySelector(selector) as HTMLMetaElement | null;

  if (existing) {
    const prev = existing.getAttribute("content");
    existing.setAttribute("content", content);
    return () => {
      if (prev === null) {
        existing.removeAttribute("content");
      } else {
        existing.setAttribute("content", prev);
      }
    };
  }

  const meta = document.createElement("meta");
  meta.setAttribute(kind, key);
  meta.setAttribute("content", content);
  head.appendChild(meta);

  return () => {
    meta.remove();
  };
};

const setProfileMetadata = (
  title: string,
  previewImageUrl?: string
): (() => void) => {
  if (typeof document === "undefined") return () => {};

  const prevTitle = document.title;
  document.title = title;

  const cleanups: Array<() => void> = [];
  cleanups.push(upsertMetaTag("name", "og:title", title));
  cleanups.push(upsertMetaTag("name", "twitter:title", title));

  if (previewImageUrl) {
    cleanups.push(upsertMetaTag("name", "og:image", previewImageUrl));
    cleanups.push(upsertMetaTag("name", "twitter:image", previewImageUrl));
  }

  return () => {
    document.title = prevTitle;
    for (const fn of cleanups.reverse()) fn();
  };
};

const setTitle = (title: string): (() => void) => {
  if (typeof document === "undefined") return () => {};

  const prevTitle = document.title;
  document.title = title;

  const cleanups: Array<() => void> = [];
  cleanups.push(upsertMetaTag("name", "og:title", title));
  cleanups.push(upsertMetaTag("name", "twitter:title", title));

  return () => {
    document.title = prevTitle;
    for (const fn of cleanups.reverse()) fn();
  };
};

export { setProfileMetadata, setTitle };
