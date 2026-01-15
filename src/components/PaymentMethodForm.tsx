import { useEffect, useMemo, useRef, useState } from "react";
import { buildPaymentMethodLabel } from "../helpers/paymentMethods/paymentMethodsStorage";
import PaymentIcons from "./paymenticons/PaymentIcons";

export type NewPaymentMethodSummary = {
  label: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard?: string;
};

export type NewPaymentMethodPayload = {
  // Matches the prcvme-api POST /me/payment/methods contract.
  nameOnCard: string;
  cardNumber: string;
  expirationDate: string; // MMYY
  cardCode?: string;
};

export type PaymentMethodFormChange = {
  isValid: boolean;
  summary: NewPaymentMethodSummary | null;
  payload: NewPaymentMethodPayload | null;
};

export type PaymentMethodFormProps = {
  onChange: (change: PaymentMethodFormChange) => void;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const digits = digitsOnly(value).slice(0, 19);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(" ");
}

function normalizeExpMonth(value: string) {
  const digits = digitsOnly(value).slice(0, 2);
  if (!digits) return "";
  const num = Number(digits);
  if (!Number.isFinite(num)) return "";
  if (num <= 0) return "";
  if (num > 12) return "12";
  return String(num).padStart(2, "0");
}

function normalizeExpYear(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits;
}

function toExpirationDateMMYY(expMonth: string, expYear: string): string {
  const month = normalizeExpMonth(expMonth);
  const yearRaw = digitsOnly(expYear);
  const yy = yearRaw.length === 4 ? yearRaw.slice(-2) : yearRaw;
  return `${month}${yy}`;
}

function isValidNewPaymentForm(form: {
  nameOnCard: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}) {
  const cardDigits = digitsOnly(form.cardNumber);
  const cvcDigits = digitsOnly(form.cvc);

  const expMonth = Number(form.expMonth);
  const expYearRaw = digitsOnly(form.expYear);
  const expYear =
    expYearRaw.length === 2 ? Number(`20${expYearRaw}`) : Number(expYearRaw);

  if (!form.nameOnCard.trim()) return false;
  if (cardDigits.length < 12 || cardDigits.length > 19) return false;
  if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) return false;
  if (!Number.isFinite(expYear) || expYear < 2000) return false;
  if (cvcDigits.length < 3 || cvcDigits.length > 4) return false;

  return true;
}

export default function PaymentMethodForm({
  onChange,
}: PaymentMethodFormProps) {
  const onChangeRef = useRef(onChange);
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isValid = useMemo(
    () =>
      isValidNewPaymentForm({
        nameOnCard,
        cardNumber,
        expMonth,
        expYear,
        cvc,
      }),
    [nameOnCard, cardNumber, expMonth, expYear, cvc]
  );

  const summary = useMemo<NewPaymentMethodSummary | null>(() => {
    if (!isValid) return null;

    const last4 = digitsOnly(cardNumber).slice(-4);
    const label = buildPaymentMethodLabel(last4, expMonth, expYear);

    return {
      last4,
      expMonth,
      expYear,
      nameOnCard: nameOnCard.trim() || undefined,
      label,
    };
  }, [isValid, nameOnCard, cardNumber, expMonth, expYear]);

  const payload = useMemo<NewPaymentMethodPayload | null>(() => {
    if (!isValid) return null;
    const expirationDate = toExpirationDateMMYY(expMonth, expYear);
    const cardDigits = digitsOnly(cardNumber);
    const cvcDigits = digitsOnly(cvc);

    return {
      nameOnCard: nameOnCard.trim(),
      cardNumber: cardDigits,
      expirationDate,
      cardCode: cvcDigits ? cvcDigits : undefined,
    };
  }, [isValid, nameOnCard, cardNumber, expMonth, expYear, cvc]);

  useEffect(() => {
    onChangeRef.current({ isValid, summary, payload });
  }, [isValid, summary, payload]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <PaymentIcons style={{ marginTop: 0, marginBottom: "0.25rem" }} />
      <div className="auth-field">
        <span>Name on card</span>
        <input
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="cc-name"
        />
      </div>

      <div className="auth-field">
        <span>Card number</span>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          autoComplete="cc-number"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <div className="auth-field">
          <span>Exp month</span>
          <input
            value={expMonth}
            onChange={(e) => setExpMonth(normalizeExpMonth(e.target.value))}
            placeholder="MM"
            inputMode="numeric"
            autoComplete="cc-exp-month"
          />
        </div>
        <div className="auth-field">
          <span>Exp year</span>
          <input
            value={expYear}
            onChange={(e) => setExpYear(normalizeExpYear(e.target.value))}
            placeholder="YY or YYYY"
            inputMode="numeric"
            autoComplete="cc-exp-year"
          />
        </div>
      </div>

      <div className="auth-field">
        <span>CVC</span>
        <input
          value={cvc}
          onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
          placeholder="123"
          inputMode="numeric"
          autoComplete="cc-csc"
        />
      </div>
    </div>
  );
}
