import type { CSSProperties } from "react";

type PaymentIconsProps = {
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

export default function PaymentIcons({
  className = "footer-payments",
  iconClassName = "footer-payment-icon",
  style,
  ariaLabel = "Accepted payment methods",
}: PaymentIconsProps) {
  return (
    <div className={className} style={style} aria-label={ariaLabel}>
      <img
        className={iconClassName}
        src="/payments/visa.png"
        alt="Visa"
        loading="lazy"
        decoding="async"
      />
      <img
        className={iconClassName}
        src="/payments/mastercard.png"
        alt="Mastercard"
        loading="lazy"
        decoding="async"
      />
      <img
        className={iconClassName}
        src="/payments/discover.png"
        alt="Discover"
        loading="lazy"
        decoding="async"
      />
      <img
        className={iconClassName}
        src="/payments/amex.png"
        alt="American Express"
        loading="lazy"
        decoding="async"
      />
      <img
        className={iconClassName}
        src="/payments/dinersclub.svg"
        alt="Diners Club"
        loading="lazy"
        decoding="async"
      />
      <img
        className={iconClassName}
        src="/payments/jcb.svg"
        alt="JCB"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
