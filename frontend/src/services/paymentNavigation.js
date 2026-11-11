const ACTIVE_PAYMENT_KEY = 'sports-center-active-payment';
const RETURN_KEY_PREFIX = 'sports-center-payment-return:';

export function redirectToPayment(paymentId, paymentUrl) {
  const { pathname, search, hash } = window.location;
  sessionStorage.setItem(`${RETURN_KEY_PREFIX}${paymentId}`, `${pathname}${search}${hash}`);
  sessionStorage.setItem(ACTIVE_PAYMENT_KEY, JSON.stringify({ paymentId }));
  window.location.assign(paymentUrl);
}

export function consumePaymentReturnPath(paymentId, role, bookingType) {
  const key = `${RETURN_KEY_PREFIX}${paymentId}`;
  const saved = sessionStorage.getItem(key);
  clearPendingPayment(paymentId);
  if (saved) {
    try {
      const destination = new URL(saved, window.location.origin);
      if (destination.origin === window.location.origin && destination.pathname.startsWith(`/${role}/`)) {
        return `${destination.pathname}${destination.search}${destination.hash}`;
      }
    } catch {
      // An invalid saved path falls back to the appropriate service page.
    }
  }
  if (role === 'receptionist') return '/receptionist/pos';
  if (role === 'member') {
    if (bookingType === 'MEMBERSHIP_PACKAGE') return '/member/packages';
    if (bookingType === 'CLASS') return '/member/classes';
    return '/member/book';
  }
  return `/${role}`;
}

export function getPendingPayment() {
  try {
    const pending = JSON.parse(sessionStorage.getItem(ACTIVE_PAYMENT_KEY) || 'null');
    if (pending && /^\d+$/.test(String(pending.paymentId))) return pending;
    // Recover a departure recorded by the previous client version as well.
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(RETURN_KEY_PREFIX)
          && sessionStorage.getItem(key) === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        const paymentId = key.slice(RETURN_KEY_PREFIX.length);
        if (/^\d+$/.test(paymentId)) return { paymentId };
      }
    }
    return null;
  } catch { return null; }
}

export function clearPendingPayment(paymentId) {
  if (String(getPendingPayment()?.paymentId) === String(paymentId)) sessionStorage.removeItem(ACTIVE_PAYMENT_KEY);
  sessionStorage.removeItem(`${RETURN_KEY_PREFIX}${paymentId}`);
}
