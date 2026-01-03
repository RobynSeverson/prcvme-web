import { useEffect, useRef, useState } from "react";
import type { DetailedHTMLProps, VideoHTMLAttributes } from "react";
import { blurredMediaStyle } from "../constants/styleConstants";

export interface SecureVideoProps {
  src: string;
  alt?: string;
  protectContent?: boolean;
  isOwner?: boolean;
  style: React.CSSProperties;
  disablePictureInPicture?: boolean;
  onClick?: (e: React.MouseEvent<HTMLVideoElement, MouseEvent>) => void;
}

const SecureVideo = ({
  src,
  protectContent,
  isOwner,
  style,
  disablePictureInPicture,
  onClick,
}: SecureVideoProps) => {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Revoke any previous blob URL.
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setResolvedSrc(src);

    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Video request failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setResolvedSrc(url);
      } catch {
        // If this fails (CORS/external URL/etc), fall back to plain <video src>.
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
  }, [src]);

  const secureVideoStyle: React.CSSProperties = {
    pointerEvents: protectContent ? "none" : undefined,
  };

  const secureVideoProps: DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > = {
    controlsList: !isOwner ? "nodownload" : undefined,
    onContextMenu: protectContent ? (e) => e.preventDefault() : undefined,
    onDragStart: protectContent ? (e) => e.preventDefault() : undefined,
  };

  const blurredMediaStyleForProtected: React.CSSProperties | undefined =
    protectContent ? blurredMediaStyle : undefined;

  return (
    <video
      {...secureVideoProps}
      src={resolvedSrc}
      controls={!protectContent}
      disablePictureInPicture={disablePictureInPicture}
      onClick={onClick}
      style={{
        ...style,
        ...secureVideoStyle,
        ...blurredMediaStyleForProtected,
      }}
    />
  );
};

export default SecureVideo;
