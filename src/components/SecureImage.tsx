import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { blurredMediaStyle } from "../constants/styleConstants";

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

  const blurredMediaStyleForProtected: React.CSSProperties | undefined =
    protectContent ? blurredMediaStyle : undefined;

  return (
    <img
      {...secureImgProps}
      src={src}
      alt={alt}
      onClick={onClick}
      onKeyDown={onKeyDown}
      loading={loading}
      tabIndex={tabIndex}
      role={role}
      style={{
        ...style,
        ...secureImageStyle,
        ...blurredMediaStyleForProtected,
      }}
    />
  );
};

export default SecureImage;
