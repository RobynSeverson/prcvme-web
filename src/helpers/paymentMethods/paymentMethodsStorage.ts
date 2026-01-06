export type StoredPaymentMethod = {
  id: string;
  label: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard?: string;
  createdAt: string;
};

export type NewPaymentMethodSummary = {
  label: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard?: string;
};

const METHODS_KEY = "prcvme.paymentMethods";
const DEFAULT_ID_KEY = "prcvme.defaultPaymentMethodId";

function safeParseStoredMethods(raw: string | null): StoredPaymentMethod[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => item as Partial<StoredPaymentMethod>)
      .filter(
        (item): item is StoredPaymentMethod =>
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.last4 === "string" &&
          typeof item.expMonth === "string" &&
          typeof item.expYear === "string" &&
          typeof item.createdAt === "string"
      );
  } catch {
    return [];
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildPaymentMethodLabel(
  last4: string,
  expMonth: string,
  expYear: string
) {
  const expSuffix = expYear.length === 2 ? expYear : expYear.slice(-2);
  return `Card •••• ${last4} (exp ${expMonth}/${expSuffix})`;
}

function readMethodsRaw(): StoredPaymentMethod[] {
  if (typeof window === "undefined") return [];
  return safeParseStoredMethods(window.localStorage.getItem(METHODS_KEY));
}

function writeMethodsRaw(methods: StoredPaymentMethod[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(METHODS_KEY, JSON.stringify(methods));
}

function readDefaultIdRaw(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEFAULT_ID_KEY);
  return raw && raw.trim() ? raw : null;
}

function writeDefaultIdRaw(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) {
    window.localStorage.removeItem(DEFAULT_ID_KEY);
    return;
  }
  window.localStorage.setItem(DEFAULT_ID_KEY, id);
}

export function loadPaymentMethods(): {
  methods: StoredPaymentMethod[];
  defaultId: string | null;
} {
  const methods = readMethodsRaw();
  const defaultId = readDefaultIdRaw();

  if (methods.length === 0) {
    if (defaultId) writeDefaultIdRaw(null);
    return { methods: [], defaultId: null };
  }

  const hasDefault = defaultId && methods.some((m) => m.id === defaultId);
  if (hasDefault) return { methods, defaultId };

  const nextDefault = methods[0].id;
  writeDefaultIdRaw(nextDefault);
  return { methods, defaultId: nextDefault };
}

export function setDefaultPaymentMethodId(id: string) {
  const { methods } = loadPaymentMethods();
  if (!methods.some((m) => m.id === id)) return;
  writeDefaultIdRaw(id);
}

export function addStoredPaymentMethodFromSummary(
  summary: NewPaymentMethodSummary,
  options?: { makeDefaultIfNone?: boolean }
): StoredPaymentMethod {
  const existing = readMethodsRaw();

  const toStore: StoredPaymentMethod = {
    ...summary,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };

  const next = [toStore, ...existing];
  writeMethodsRaw(next);

  const defaultId = readDefaultIdRaw();
  const makeDefault = options?.makeDefaultIfNone ?? true;
  if (makeDefault && !defaultId) {
    writeDefaultIdRaw(toStore.id);
  }

  return toStore;
}

export function removeStoredPaymentMethod(id: string): {
  methods: StoredPaymentMethod[];
  defaultId: string | null;
} {
  const existing = readMethodsRaw();
  const next = existing.filter((m) => m.id !== id);
  writeMethodsRaw(next);

  const defaultId = readDefaultIdRaw();
  if (!defaultId) {
    return loadPaymentMethods();
  }

  if (defaultId === id) {
    const nextDefault = next.length > 0 ? next[0].id : null;
    writeDefaultIdRaw(nextDefault);
  }

  return loadPaymentMethods();
}

export function getDefaultPaymentMethodId(): string | null {
  return loadPaymentMethods().defaultId;
}

export function getDefaultPaymentMethod(): StoredPaymentMethod | null {
  const { methods, defaultId } = loadPaymentMethods();
  if (!defaultId) return null;
  return methods.find((m) => m.id === defaultId) ?? null;
}
