import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/apiClient';
import { consumePaymentReturnPath, getPendingPayment } from '../services/paymentNavigation';

async function verifyPayment(query) {
  const params = new URLSearchParams(query);
  // Cancelling an owned unpaid order is an authenticated action, independent of
  // whether VNPay supplies a verifiable receipt for its Back/Cancel screen.
  if (params.get('vnp_ResponseCode') === '24') {
    const paymentId = getPendingPayment()?.paymentId || params.get('vnp_TxnRef')?.split('_')[0];
    if (/^\d+$/.test(String(paymentId))) {
      try {
        const payment = await apiRequest(`/payments/${paymentId}/cancel-unpaid`, { method: 'POST' });
        if (payment.paymentStatus === 'CANCELLED') {
          return { paymentId, title: 'Đã hủy thanh toán', message: 'Chỗ giữ đã được trả lại. Bạn có thể đăng ký lớp lại ngay.', type: 'warning' };
        }
        if (payment.paymentStatus === 'PAID') {
          return { paymentId, title: 'Thanh toán thành công', message: 'Thanh toán đã được ghi nhận; đăng ký của bạn được giữ nguyên.', type: 'success' };
        }
        if (payment.paymentStatus === 'REFUNDED') {
          return { paymentId, title: 'Giao dịch đã hoàn tiền', message: 'Giao dịch này đã được hoàn tiền.', type: 'warning' };
        }
        throw new Error('Chưa xác nhận hủy');
      } catch {
        return { needsRetry: true, message: 'Chưa hủy được yêu cầu giữ chỗ. Bấm thử lại để hoàn tất hủy và đăng ký lại.' };
      }
    }
  }
  if (!params.get('vnp_ResponseCode') || !params.get('vnp_TxnRef')) {
    return { title: 'Thanh toán thất bại', message: 'Thiếu thông tin giao dịch để xác thực.', type: 'error' };
  }
  try {
    const result = await apiRequest(`/webhooks/vnpay/return?${query}`);
    if (result.success === false && result.status === 'FAILED') {
      const paymentId = params.get('vnp_TxnRef').split('_')[0];
      await apiRequest(`/payments/${paymentId}/cancel-unpaid`, { method: 'POST' });
    }
    const successful = result.success === true && ['PAID', 'CONFIRMED', 'PENDING_APPROVAL', 'ACTIVE'].includes(result.status);
    const review = result.success === true && ['CANCELLED', 'REFUNDED', 'EXCESS', 'REVIEW_REQUIRED'].includes(result.status);
    return {
      title: successful ? 'Thanh toán thành công' : review ? 'Cần kiểm tra giao dịch' : 'Thanh toán thất bại',
      message: result.message || (successful ? 'Đã nhận thanh toán.' : 'Giao dịch chưa được thanh toán thành công.'),
      type: successful ? 'success' : review ? 'warning' : 'error',
      bookingType: result.bookingType,
      paymentId: result.paymentId,
    };
  } catch {
    return { title: 'Chưa xác minh được thanh toán', message: 'Không thể kết nối để xác minh. Vui lòng kiểm tra trạng thái giao dịch trước khi thanh toán lại.', type: 'warning' };
  }
}

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, currentRole, showToast } = useApp();
  const verification = useRef(null);
  const [cancellationError, setCancellationError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const query = searchParams.toString();

  useEffect(() => {
    if (!currentUser || !currentRole) {
      navigate('/login', { replace: true });
      return;
    }
    // Reuse the request across StrictMode effects; show the result exactly once.
    if (!verification.current || verification.current.query !== query || verification.current.retryCount !== retryCount) {
      verification.current = { query, retryCount, promise: verifyPayment(query), completed: false };
    }
    const request = verification.current;
    let active = true;
    request.promise.then((result) => {
      if (!active || request.completed) return;
      request.completed = true;
      if (result.needsRetry) {
        setCancellationError(result.message);
        return;
      }
      const params = new URLSearchParams(query);
      const paymentId = result.paymentId || params.get('vnp_TxnRef')?.split('_')[0];
      const destination = consumePaymentReturnPath(paymentId, currentRole, result.bookingType || params.get('bookingType'));
      navigate(destination, { replace: true });
      showToast(result.title, result.message, result.type);
    });
    return () => { active = false; };
  }, [query, currentUser, currentRole, navigate, showToast, retryCount]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
      <div className="text-center">
        {cancellationError ? (
          <div className="max-w-md p-6 space-y-4">
            <p>{cancellationError}</p>
            <button type="button" onClick={() => { setCancellationError(''); setRetryCount((count) => count + 1); }} className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Thử hủy lại</button>
          </div>
        ) : <>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
        <p className="mt-4 text-slate-600">Đang xác thực thanh toán và quay lại trang trước...</p>
        </>}
      </div>
    </div>
  );
}
