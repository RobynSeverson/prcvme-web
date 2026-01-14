import type { CSSProperties } from "react";

export type DriversLicenseIconProps = {
  size?: number;
  title?: string;
  style?: CSSProperties;
  className?: string;
};

export default function DriversLicenseIcon({
  size = 22,
  title = "Driver's license",
  style,
  className,
}: DriversLicenseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      {/* Card */}
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      {/* Photo circle */}
      <circle
        cx="8.2"
        cy="11"
        r="2.1"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* Text lines */}
      <path
        d="M12 9.5H18.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 12.5H18.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 16H18.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
