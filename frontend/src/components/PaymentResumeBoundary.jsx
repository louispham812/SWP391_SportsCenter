import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/apiClient';
import { clearPendingPayment, getPendingPayment } from '../services/paymentNavigation';

const isGatewayReturn = (path) => ['/payment/return', '/vnpay-return'].includes(path);

export default function PaymentResumeBoundary({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [checking, setChecking] = useState(() => !!getPendingPayment() && !isGatewayReturn(window.location.pathname));
  const cancellation = useRef(null);

  useEffect(() => {
    let active = true;
    const resume = () => {
      const pending = getPendingPayment();
      if (!pending || !currentUser || isGatewayReturn(pathname)) {
        setChecking(false);
        return;
      }
      if (cancellation.current?.paymentId !== pending.paymentId) {
        cancellation.current = {
          paymentId: pending.paymentId,
          promise: apiRequest(`/payments/${pending.paymentId}/cancel-unpaid`, { method: 'POST' }),
          finished: false,
        };
      }
      const request = cancellation.current;
      if (request.finished) return;
      // Unmount the source page while releasing the hold so its next data load is fresh.
      setChecking(true);
      request.promise.then((result) => {
        if (!active || request.finished) return;
        request.finished = true;
        clearPendingPayment(pending.paymentId);
        if (result.paymentStatus === 'CANCELLED') {
          showToast('Đã hủy thanh toán', 'Bạn chưa thanh toán. Chỗ giữ đã được trả lại, bạn có thể đăng ký lại.', 'warning');
        } else if (result.paymentStatus === 'PAID') {
          showToast('Thanh toán đã được ghi nhận', 'Vui lòng xem trạng thái đơn hàng vừa được cập nhật.', 'success');
          if (pathname.startsWith('/member/book/checkout/')) {
            navigate('/member/schedule', { replace: true });
          }
        }
        setChecking(false);
      }).catch(() => {
        if (!active || request.finished) return;
        request.finished = true;
        showToast('Chưa kiểm tra được giao dịch', 'Không thể giải phóng chỗ giữ. Vui lòng thử lại hoặc hủy yêu cầu trong danh sách.', 'warning');
        setChecking(false);
      });
    };
    const onPageShow = (event) => {
      if (event.persisted) {
        cancellation.current = null;
        resume();
      }
    };
    resume();
    window.addEventListener('pageshow', onPageShow);
    return () => { active = false; window.removeEventListener('pageshow', onPageShow); };
  }, [pathname, currentUser, showToast, navigate]);

  if (checking && !isGatewayReturn(pathname)) {
    return <div role="status" className="min-h-screen flex items-center justify-center text-slate-600">Đang kiểm tra thanh toán và cập nhật chỗ giữ...</div>;
  }
  return children;
}
