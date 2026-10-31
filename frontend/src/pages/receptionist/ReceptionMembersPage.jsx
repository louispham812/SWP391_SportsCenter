import React, { useEffect, useRef, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import QrCodeSvg from '../../components/common/QrCodeSvg';
import Pagination from '../../components/common/Pagination';
import {
  searchReceptionistMembers,
  updateReceptionMemberAvatar,
  updateReceptionMemberRfid,
  updateReceptionMemberEmergencyContact,
} from '../../services/receptionistApi';

export default function ReceptionMembersPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [response, setResponse] = useState(null);

  // Modals state
  const [avatarMember, setAvatarMember] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [rfidMember, setRfidMember] = useState(null);
  const [rfidInput, setRfidInput] = useState('');

  const [emergencyMember, setEmergencyMember] = useState(null);
  const [emergencyForm, setEmergencyForm] = useState({ name: '', phone: '' });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const requestKey = `${submittedQuery}\u0000${page}\u0000${refreshKey}`;
  const loading = response?.key !== requestKey;
  const result = response?.key === requestKey ? response.data : null;
  const error = response?.key === requestKey ? response.error : '';

  useEffect(() => {
    let active = true;
    searchReceptionistMembers(submittedQuery, page)
      .then((data) => {
        if (active) setResponse({ key: requestKey, data, error: '' });
      })
      .catch((requestError) => {
        if (active) {
          setResponse({
            key: requestKey,
            data: null,
            error: requestError.message || 'Không thể tải danh sách hội viên.',
          });
        }
      });
    const handleSaveEmergency = async (e) => {
    e.preventDefault();
    if (!emergencyMember) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateReceptionMemberEmergencyContact(emergencyMember.userId, {
        emergencyContactName: emergencyForm.name.trim(),
        emergencyContactPhone: emergencyForm.phone.trim(),
      });
      setActionSuccess('Cập nhật liên hệ khẩn cấp thành công!');
      setTimeout(() => {
        setEmergencyMember(null);
        setEmergencyForm({ name: '', phone: '' });
        setActionSuccess('');
        setRefreshKey((k) => k + 1);
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Không thể cập nhật liên hệ khẩn cấp.');
    } finally {
      setActionLoading(false);
    }
  };

  return () => {
      active = false;
    };
  }, [submittedQuery, page, requestKey]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setSubmittedQuery(query.trim());
  };

  // Webcam controls
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Không thể mở webcam hoặc quyền truy cập bị từ chối.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setAvatarPreview(dataUrl);
    stopCamera();
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setActionError('Vui lòng chọn ảnh dung lượng dưới 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarMember || !avatarPreview) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateReceptionMemberAvatar(avatarMember.userId, avatarPreview);
      setActionSuccess('Cập nhật ảnh nhận diện hội viên thành công!');
      setTimeout(() => {
        setAvatarMember(null);
        setAvatarPreview('');
        setActionSuccess('');
        setRefreshKey((k) => k + 1);
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Không thể lưu ảnh đại diện.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRfid = async (e) => {
    e.preventDefault();
    if (!rfidMember) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateReceptionMemberRfid(rfidMember.userId, rfidInput.trim());
      setActionSuccess('Cập nhật mã thẻ từ RFID thành công!');
      setTimeout(() => {
        setRfidMember(null);
        setRfidInput('');
        setActionSuccess('');
        setRefreshKey((k) => k + 1);
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Không thể cấp thẻ RFID.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEmergency = async (e) => {
    e.preventDefault();
    if (!emergencyMember) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateReceptionMemberEmergencyContact(emergencyMember.userId, {
        emergencyContactName: emergencyForm.name.trim(),
        emergencyContactPhone: emergencyForm.phone.trim(),
      });
      setActionSuccess('Cập nhật liên hệ khẩn cấp thành công!');
      setTimeout(() => {
        setEmergencyMember(null);
        setEmergencyForm({ name: '', phone: '' });
        setActionSuccess('');
        setRefreshKey((k) => k + 1);
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Không thể cập nhật liên hệ khẩn cấp.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              F SPORT RECEPTION · HỒ SƠ HỘI VIÊN &amp; CẤP THẺ
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Tra cứu hồ sơ &amp; Cấp thẻ hội viên</h1>
            <p className="text-sm text-slate-500">Tìm kiếm nhanh theo họ tên, email, số điện thoại, cấp thẻ từ RFID và cập nhật ảnh nhận diện quầy.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Thêm người dùng mới
          </button>
        </header>

        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="member-search">Từ khóa tìm kiếm</label>
          <input
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập tên, email, số điện thoại hoặc mã thẻ RFID..."
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          <button type="submit" className="rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer">
            Tìm hội viên
          </button>
        </form>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu hội viên...</p>
          ) : result?.content?.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Mã</th>
                      <th className="px-5 py-3.5">Hội viên</th>
                      <th className="px-5 py-3.5">Liên hệ</th>
                      <th className="px-5 py-3.5">Thẻ từ RFID / QR</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right">Thao tác quầy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.content.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-slate-500 font-bold">#{member.userId}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-xs text-slate-600">
                                  {member.fullName?.slice(0, 2).toUpperCase() || 'MB'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{member.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">SPORTHUB-MEMBER-{member.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="font-medium">{member.phone || 'Chưa có SĐT'}</div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                          {member.emergencyContactName && (
                            <div className="text-[11px] text-red-600 font-medium mt-0.5">
                              SOS: {member.emergencyContactName} ({member.emergencyContactPhone || '—'})
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {member.rfidCode ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                              <span className="material-symbols-outlined text-[14px]">contactless</span>
                              <span>{member.rfidCode}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                              Chưa cấp thẻ từ
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{member.status || 'CHƯA CẬP NHẬT'}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarMember(member);
                                setAvatarPreview(member.avatar || '');
                                setActionError('');
                                setActionSuccess('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="Cập nhật ảnh nhận diện quầy (Webcam / File)"
                            >
                              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                              <span>Ảnh thẻ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRfidMember(member);
                                setRfidInput(member.rfidCode || '');
                                setActionError('');
                                setActionSuccess('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="Cấp thẻ từ RFID / Xem mã QR"
                            >
                              <span className="material-symbols-outlined text-[16px]">badge</span>
                              <span>Cấp RFID/QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEmergencyMember(member);
                                setEmergencyForm({
                                  name: member.emergencyContactName || '',
                                  phone: member.emergencyContactPhone || '',
                                });
                                setActionError('');
                                setActionSuccess('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="Cập nhật liên hệ khẩn cấp"
                            >
                              <span className="material-symbols-outlined text-[16px]">emergency</span>
                              <span>Khẩn cấp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-5 py-4 gap-3 text-sm">
                <span className="text-slate-500 font-medium">Tổng cộng {result.totalElements} hội viên</span>
                {result.totalPages > 1 && (
                  <Pagination
                    currentPage={page + 1}
                    totalPages={result.totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                  />
                )}
              </div>
            </>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">Không tìm thấy hội viên phù hợp.</p>
          )}
        </section>
      </div>

      {/* Modal 1: Cập nhật ảnh nhận diện quầy (REC-03) */}
      {avatarMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập Nhật Ảnh Nhận Diện Quầy</h3>
                <p className="text-xs text-slate-500">Hội viên: <strong>{avatarMember.fullName}</strong> (#{avatarMember.userId})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setAvatarMember(null);
                  setAvatarPreview('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{actionSuccess}</div>
            )}

            {/* Camera / Preview Area */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden min-h-[220px]">
              {cameraActive ? (
                <div className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none"></div>
                </div>
              ) : avatarPreview ? (
                <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md">
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-[44px]">face</span>
                  <span className="text-[11px] font-bold mt-1">Chưa có ảnh</span>
                </div>
              )}

              {cameraError && (
                <p className="text-xs text-red-600 mt-2 font-medium">{cameraError}</p>
              )}
            </div>

            {/* Camera & File actions */}
            <div className="grid grid-cols-2 gap-2">
              {cameraActive ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">camera</span>
                  <span>Chụp ngay</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  <span>Bật Webcam</span>
                </button>
              )}

              <label className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Tải ảnh file</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={!avatarPreview || actionLoading}
                onClick={handleSaveAvatar}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/25"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{actionLoading ? 'Đang lưu ảnh...' : 'Lưu ảnh nhận diện'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setAvatarMember(null);
                  setAvatarPreview('');
                }}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Cấp thẻ từ RFID / Xem mã QR (REC-08) */}
      {rfidMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cấp Thẻ Từ RFID &amp; Mã QR</h3>
                <p className="text-xs text-slate-500">Hội viên: <strong>{rfidMember.fullName}</strong> (#{rfidMember.userId})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRfidMember(null);
                  setRfidInput('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{actionSuccess}</div>
            )}

            {/* QR Card preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <QrCodeSvg
                text={`SPORTHUB-MEMBER-${rfidMember.userId}`}
                size={160}
              />
              <div className="mt-2.5 font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-300">
                SPORTHUB-MEMBER-{rfidMember.userId}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Mã QR định danh hệ thống (tự động theo User ID)</p>
            </div>

            {/* RFID Input Form */}
            <form onSubmit={handleSaveRfid} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="rfid-input">
                  Mã Thẻ Từ RFID Quẹt Đầu Đọc
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-slate-400">contactless</span>
                  <input
                    id="rfid-input"
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="VD: RFID-SH-0009 hoặc quẹt thẻ từ USB..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đặt thẻ từ vào đầu đọc RFID USB để hệ thống tự điền mã hoặc nhập thủ công.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/25"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{actionLoading ? 'Đang lưu...' : 'Lưu Thẻ RFID'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRfidMember(null);
                    setRfidInput('');
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Cập nhật liên hệ khẩn cấp (REC-09) */}
      {emergencyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Liên Hệ Khẩn Cấp (Emergency Contact)</h3>
                <p className="text-xs text-slate-500">Hội viên: <strong>{emergencyMember.fullName}</strong> (#{emergencyMember.userId})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmergencyMember(null);
                  setEmergencyForm({ name: '', phone: '' });
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{actionSuccess}</div>
            )}

            <form onSubmit={handleSaveEmergency} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="emergency-name">
                  Tên người liên hệ khẩn cấp *
                </label>
                <input
                  id="emergency-name"
                  type="text"
                  required
                  value={emergencyForm.name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  placeholder="VD: Người thân, Ba/Mẹ, Vợ/Chồng..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="emergency-phone">
                  Số điện thoại khẩn cấp *
                </label>
                <input
                  id="emergency-phone"
                  type="tel"
                  required
                  value={emergencyForm.phone}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                  placeholder="VD: 0988 777 666"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-red-500/25"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{actionLoading ? 'Đang lưu...' : 'Lưu Thông Tin Khẩn Cấp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyMember(null);
                    setEmergencyForm({ name: '', phone: '' });
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </ReceptionistLayout>
  );
}
