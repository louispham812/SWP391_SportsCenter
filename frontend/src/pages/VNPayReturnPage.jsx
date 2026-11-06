import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * VNPay Return Page
 * 
 * VNPay redirects user back to this page after payment
 * Parse vnp_ResponseCode to determine success/failure
 * 
 * Response Codes:
 * 00: Success
 * 07: Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).
 * 09: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.
 * 10: Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
 * 11: Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.
 * 12: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.
 * 13: Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.
 * 24: Giao dịch không thành công do: Khách hàng hủy giao dịch
 * 51: Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.
 * 65: Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.
 * 75: Ngân hàng thanh toán đang bảo trì.
 * 79: Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch
 * 99: Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)
 */
export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, currentRole, showToast } = useApp();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  
  useEffect(() => {
    const verifyPayment = async () => {
      // Check auth first - nếu không có auth thì redirect login
      if (!currentUser || !currentRole) {
        console.warn('No auth found, redirecting to login...');
        navigate('/login', { replace: true });
        return;
      }
      
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const rawTxnRef = searchParams.get('vnp_TxnRef');
      const vnpTxnRef = rawTxnRef && rawTxnRef.includes('_') ? rawTxnRef.split('_')[0] : rawTxnRef;
      const vnpSecureHash = searchParams.get('vnp_SecureHash');
      
      setPaymentId(vnpTxnRef);
      
      if (!vnpResponseCode || !rawTxnRef) {
        setStatus('error');
        setMessage('Thiếu thông tin giao dịch');
        return;
      }
      
      // Check VNPay response code first
      if (vnpResponseCode !== '00') {
        setStatus('error');
        setMessage(getErrorMessage(vnpResponseCode));
        return;
      }
      
      try {
        // Call backend to verify signature and update payment status
        const queryString = window.location.search.substring(1);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/webhooks/vnpay/return?${queryString}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Không thể xác thực giao dịch. Vui lòng liên hệ hỗ trợ.');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('Lỗi kết nối. Vui lòng kiểm tra lại trạng thái đơn hàng.');
      }
    };
    
    verifyPayment();
  }, [searchParams, currentUser, currentRole, navigate]);
  
  const getErrorMessage = (code) => {
    const messages = {
      '07': 'Giao dịch bị nghi ngờ gian lận. Vui lòng liên hệ ngân hàng.',
      '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking.',
      '10': 'Xác thực thông tin không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán (15 phút).',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Nhập sai mật khẩu OTP.',
      '24': 'Khách hàng hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư.',
      '65': 'Vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng đang bảo trì.',
      '79': 'Nhập sai mật khẩu quá số lần quy định.',
      '99': 'Lỗi không xác định.',
    };
    return messages[code] || 'Giao dịch thất bại. Vui lòng thử lại.';
  };
  
  const handleContinue = () => {
    // Show toast success message
    if (status === 'success') {
    showToast('Thanh toán thành công', message, 'success');
    // Delay navigate để user thấy toast
    setTimeout(() => {
        navigate('/receptionist/pos', { replace: true });
    }, 1500);
}
    
    // Determine target page based on user role and booking type
    if (!currentUser || !currentRole) {
      // User not logged in → go to login
      navigate('/login', { replace: true });
      return;
    }
    
    const bookingType = searchParams.get('bookingType');
    
    // Route based on role
    if (currentRole === 'receptionist') {
      // Receptionist always returns to POS dashboard
      navigate('/receptionist/pos', { replace: true });
    } else if (currentRole === 'member') {
      // Member navigates based on booking type
      const targetPage = bookingType === 'CLASS' ? '/member/classes' :
                        bookingType === 'COURT' ? '/member/book' :
                        bookingType === 'MEMBERSHIP_PACKAGE' ? '/member/packages' :
                        '/member/dashboard';
      navigate(targetPage, { replace: true });
    } else {
      // Other roles → go to their dashboard
      navigate(`/${currentRole}`, { replace: true });
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {status === 'success' ? (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanh toán thành công!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              {paymentId && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Mã giao dịch</p>
                  <p className="text-lg font-mono text-slate-900">#{paymentId}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleContinue}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Quay lại trang chủ
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <span className="material-symbols-outlined text-4xl text-red-600">error</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanh toán thất bại</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              {paymentId && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Mã giao dịch</p>
                  <p className="text-lg font-mono text-slate-900">#{paymentId}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                Thử lại
              </button>
              <button
                onClick={handleContinue}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition"
              >
                Quay lại trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
