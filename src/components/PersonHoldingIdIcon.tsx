import type { CSSProperties } from "react";

export type PersonHoldingIdIconProps = {
  size?: number;
  title?: string;
  style?: CSSProperties;
  className?: string;
};

export default function PersonHoldingIdIcon({
  size = 22,
  title = "Person holding ID",
  style,
  className,
}: PersonHoldingIdIconProps) {
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
      {/* Head */}
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />

      {/* Body */}
      <path
        d="M3.8 18.6c.4-3 2.5-5 4.8-5s4.4 2 4.8 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Arm holding ID */}
      <path
        d="M11.3 14.3l2.2-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.5 12.7l1.6 1.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* ID card */}
      <rect
        x="15.1"
        y="9.4"
        width="6.9"
        height="5.8"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.4 11.2h4.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M16.4 13h2.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
