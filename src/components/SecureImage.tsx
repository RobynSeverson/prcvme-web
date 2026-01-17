import { useEffect, useRef, useState } from "react";
import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { useCurrentUser } from "../context/CurrentUserContext";

export interface SecureImageProps {
  src: string;
  alt?: string;
  protectContent?: boolean;
  isOwner?: boolean;
  style: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLImageElement>) => void;
  loading?: "eager" | "lazy";
  tabIndex?: number;
  role?: string;
}

const SecureImage = ({
  src,
  alt,
  protectContent,
  isOwner,
  style,
  onClick,
  onKeyDown,
  loading,
  tabIndex,
  role,
}: SecureImageProps) => {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const objectUrlRef = useRef<string | null>(null);
  const { token, authedFetch } = useCurrentUser();

  useEffect(() => {
    // Revoke any previous blob URL.
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setResolvedSrc(src);

    if (typeof window === "undefined") return;

    if (!token) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await authedFetch(src, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Image request failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setResolvedSrc(url);
      } catch {
        // If this fails (CORS/external URL/etc), fall back to plain <img src>.
        if (!controller.signal.aborted) {
          setResolvedSrc(src);
        }
      }
    })();

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, authedFetch, token]);

  const secureImageStyle: React.CSSProperties = {
    userSelect: !isOwner ? "none" : undefined,
    WebkitTouchCallout: !isOwner ? "none" : undefined,
    cursor: protectContent ? undefined : "zoom-in",
  };

  const secureImgProps: DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > = {
    draggable: !isOwner ? false : undefined,
    onContextMenu: !isOwner ? (e) => e.preventDefault() : undefined,
    onDragStart: !isOwner ? (e) => e.preventDefault() : undefined,
  };

  return (
    <img
      {...secureImgProps}
      src={resolvedSrc}
      alt={alt}
      onClick={onClick}
      onKeyDown={onKeyDown}
      loading={loading}
      tabIndex={tabIndex}
      role={role}
      style={{
        ...style,
        ...secureImageStyle,
      }}
    />
  );
};

export default SecureImage;
