import type { SubscriptionDeal } from "../models/user";

type DealStyles = Record<string, string>;

export type DealProps = {
  deal: SubscriptionDeal;
  monthlyPrice?: number;
  creatorProfilePictureSrc?: string | null;
  isSubscribed: boolean;
  isSubLoading: boolean;
  isUnsubscribing: boolean;
  onSubscribe: (dealId: string) => void;
  styles: DealStyles;
};

function formatDealDiscountPct(
  deal: SubscriptionDeal,
  monthlyPrice?: number
): string | null {
  if (
    typeof monthlyPrice !== "number" ||
    !Number.isFinite(monthlyPrice) ||
    monthlyPrice <= 0
  ) {
    return null;
  }
  if (
    typeof deal.months !== "number" ||
    !Number.isFinite(deal.months) ||
    deal.months <= 0
  ) {
    return null;
  }
  if (
    typeof deal.price !== "number" ||
    !Number.isFinite(deal.price) ||
    deal.price <= 0
  ) {
    return null;
  }

  const regularTotal = monthlyPrice * deal.months;
  if (!Number.isFinite(regularTotal) || regularTotal <= 0) return null;

  const pct = Math.round((1 - deal.price / regularTotal) * 100);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return `${pct}% off`;
}

function formatDealExpiresLabel(deal: SubscriptionDeal): string | null {
  if (typeof deal.expiresAt !== "string" || !deal.expiresAt.trim()) return null;
  const date = new Date(deal.expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Offer ends ${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

function formatMoney(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "0.00";
}

export default function Deal({
  deal,
  monthlyPrice,
  creatorProfilePictureSrc,
  isSubscribed,
  isSubLoading,
  isUnsubscribing,
  onSubscribe,
  styles,
}: DealProps) {
  const discount = formatDealDiscountPct(deal, monthlyPrice);
  const expiresLabel = formatDealExpiresLabel(deal);

  return (
    <li key={deal.dealId} className={styles.dealItem}>
      <div className={styles.dealMeta}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <strong>{deal.title}</strong>
          {discount ? (
            <span className={styles.dealDiscountBadge}>{discount}</span>
          ) : null}
        </div>

        {deal.description ? (
          <div className={`text-muted ${styles.dealDescriptionRow}`}>
            {creatorProfilePictureSrc ? (
              <img
                src={creatorProfilePictureSrc}
                alt=""
                aria-hidden="true"
                className={styles.dealDescriptionAvatar}
                draggable={false}
              />
            ) : null}
            <span>{deal.description}</span>
          </div>
        ) : null}

        {expiresLabel ? (
          <div className={`text-muted ${styles.dealExpires}`}>
            {expiresLabel}
          </div>
        ) : null}

        <div className="text-muted" style={{ marginTop: "0.25rem" }}>
          {deal.months} month{deal.months === 1 ? "" : "s"} for $
          {formatMoney(deal.price)} then $
          {typeof monthlyPrice === "number" && Number.isFinite(monthlyPrice)
            ? monthlyPrice.toFixed(2)
            : "0.00"}
          /mo
        </div>
      </div>

      {!isSubscribed ? (
        <div className={styles.dealCta}>
          <button
            type="button"
            className={`auth-submit ${styles.dealButton}`}
            disabled={isSubLoading || isUnsubscribing}
            onClick={() => {
              onSubscribe(deal.dealId);
            }}
          >
            Subscribe {deal.months} month{deal.months === 1 ? "" : "s"} for ($
            {formatMoney(deal.price)})
          </button>
        </div>
      ) : null}
    </li>
  );
}
