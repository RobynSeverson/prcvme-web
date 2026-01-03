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
      src={src}
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
