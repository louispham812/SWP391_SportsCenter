import React, { useState, useRef, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberAIAssistantPage() {
  const { currentUser, healthProfile, activePlan } = useApp();

  const chatEndRef = useRef(null);

  // Danh sách hội thoại mẫu khởi tạo
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Xin chào ${currentUser?.name || 'Võ Tấn Triều'}! Tôi là **Trợ Lý Thể Thao AI** của FPT Sports Center.\n\nTôi được tích hợp dữ liệu thời gian thực để hỗ trợ bạn về:\n• 🏋️ **Gợi ý bài tập & Phân tích InBody**\n• 📅 **Lịch tập cá nhân & Đăng ký ca học**\n• 💳 **Quy định hủy ca, Hoàn tiền Ví FPT Pay & Dịch vụ trung tâm**\n\nBạn cần tôi hỗ trợ thông tin gì hôm nay?`,
      time: '08:30 AM',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Danh mục gợi ý câu hỏi nhanh theo 3 nhóm nghiệp vụ
  const quickPrompts = [
    { label: 'Quy định hủy ca & hoàn tiền', topic: 'service' },
    { label: 'Gợi ý bài tập bổ trợ Pickleball', topic: 'workout' },
    { label: 'Xem chỉ số InBody & Calo', topic: 'inbody' },
    { label: 'Hướng dẫn đặt sân & Đổi lịch', topic: 'schedule' },
    { label: 'Đặc quyền gói VIP Diamond', topic: 'service' },
  ];

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Xử lý gửi câu hỏi cho AI
  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Xử lý logic câu trả lời của AI dựa trên từ khóa nghiệp vụ
    setTimeout(() => {
      let aiReply = '';
      const q = query.toLowerCase();

      // 1. Nhóm Dịch vụ & Quy định hủy/hoàn tiền
      if (q.includes('hủy') || q.includes('hoàn tiền') || q.includes('quy định') || q.includes('ví')) {
        aiReply =
          '📋 **Quy định Hủy ca tập & Hoàn tiền FPT Sports Center:**\n\n' +
          '• **Hủy trước giờ tập > 2 tiếng:** Hoàn tiền 100% tự động về **Ví FPT Pay** (hoặc trả lại 1 lượt tập VIP) và tự động gỡ ca khỏi Lịch tập cá nhân.\n' +
          '• **Hủy trước giờ tập < 2 tiếng:** Hệ thống không hỗ trợ hoàn tiền do slot đã được giữ chỗ cho HLV và sân bãi.\n' +
          '• Bạn có thể quản lý và thao tác hủy tại mục **"Đơn đăng ký & Hóa đơn"**.';
      } 
      // 2. Nhóm Bài tập & Thể trạng
      else if (q.includes('pickleball') || q.includes('bài tập') || q.includes('gym') || q.includes('tập')) {
        aiReply =
          `🏋️ **Gợi ý bài tập bổ trợ chuyên sâu (Dành cho ${currentUser?.name || 'Hội viên'}):**\n\n` +
          '1. **Agility Ladder Drills (Di chuyển thang dây):** 4 hiệp x 45 giây — Tăng tốc độ bộ chân ở vùng lưới Net.\n' +
          '2. **Single-Leg Calf Raise (Nhón bắp chuối đơn):** 3 hiệp x 15 lần (Tạ 12kg) — Củng cố nhóm cơ cổ chân sau bong gân.\n' +
          '3. **Medicine Ball Rotational Throw:** 3 hiệp x 12 lần — Tăng lực bộc phát cho đòn Smash xoáy.\n\n' +
          '💡 *Lời khuyên từ HLV Lê Anh Tuấn:* Giãn cơ lạnh PNF 10 phút sau buổi tập để bảo vệ khớp cổ chân.';
      } 
      // 3. Nhóm InBody & Dinh dưỡng
      else if (q.includes('inbody') || q.includes('chỉ số') || q.includes('cân nặng') || q.includes('calo')) {
        aiReply =
          `📊 **Phân tích chỉ số InBody mới nhất (Ngày ${healthProfile?.lastTested || '18/11/2026'}):**\n\n` +
          `• **Cân nặng:** ${healthProfile?.weight || 64.2} kg (Chỉ số BMI: ${healthProfile?.bmi || 21.4} - Cân đối)\n` +
          `• **Khối lượng cơ nạc (SMM):** ${healthProfile?.smm || 32.5} kg (Tăng +1.4kg cơ nạc)\n` +
          `• **Tỷ lệ mỡ cơ thể (PBF):** ${healthProfile?.pbf || 17.8}% (Ngưỡng VĐV phong trào)\n\n` +
          '🎯 **Khuyến nghị dinh dưỡng:** Duy trì 2.100 kcal/ngày, bổ sung ~130g Protein để duy trì mật độ cơ.';
      } 
      // 4. Nhóm Lịch học & Đặt sân
      else if (q.includes('lịch') || q.includes('lớp') || q.includes('đặt sân') || q.includes('ca')) {
        aiReply =
          '📅 **Thông tin Lịch tập & Đặt sân FPT Sports Center:**\n\n' +
          '• Bạn có ca **Pickleball Chiến Thuật Nâng Cao** lúc 18:00 hôm nay tại Sân Mái Che Pro 01.\n' +
          '• Để đặt thêm sân tự do (Tennis, Cầu lông, Pickleball), bạn truy cập mục **"Đặt sân tự do"** trên Menu.\n' +
          '• Mã QR Entry Pass check-in cổng RFID luôn khả dụng tại mục **"Lịch tập cá nhân"**.';
      } 
      // 5. Nhóm Gói tập VIP & Tiện ích
      else if (q.includes('gói') || q.includes('vip') || q.includes('thẻ') || q.includes('dịch vụ')) {
        aiReply =
          `👑 **Đặc quyền Gói tập hiện tại (${activePlan?.name || 'VIP Diamond Member'}):**\n\n` +
          '• Miễn phí 100% phí đăng ký 30+ bộ môn thể thao tiêu chuẩn.\n' +
          '• Tặng 8 buổi tập Private 1:1 cùng Master Coach.\n' +
          '• Tự do sử dụng bể bơi Olympic 50m, phòng xông hơi Jacuzzi và tủ đồ thông minh RFID.';
      } 
      // Mặc định
      else {
        aiReply =
          `Cảm ơn câu hỏi của bạn! Với tư cách là Trợ Lý Thể Thao AI của FPT Sports Center, tôi có thể giúp bạn giải đáp các vấn đề về **Bài tập bổ trợ**, **Thời khóa biểu lớp học**, **Chỉ số InBody** hoặc **Chính sách hoàn tiền/hủy ca**. Bạn có thể chọn các gợi ý nhanh bên dưới để xem thông tin chi tiết.`;
      }

      const aiTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiReply,
          time: aiTime,
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                  AI ATHLETIC ASSISTANT 24/7
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Trợ Lý Thể Thao AI FPT
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                Hỏi đáp thông minh về giáo án bài tập, phân tích InBody, kiểm tra lịch tập và dịch vụ trung tâm.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 shrink-0 flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              </div>
              <div>
                <div className="font-bold text-white">Gemini Pro Sports Engine</div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Đã kết nối AppContext
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid: 5 cols Sinh trắc học & Lịch học / 7 cols AI Chat Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI (5 cols): Tóm tắt Hồ sơ Thể trạng & Gói tập */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Thẻ chỉ số InBody cá nhân */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    INBODY TELEMETRY
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">Chỉ Số Thể Trạng Cá Nhân</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{healthProfile?.lastTested || '18/11/2026'}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Cân Nặng</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{healthProfile?.weight || 64.2} <span className="text-xs font-medium">kg</span></div>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded block">-2.8 kg mỡ</span>
                </div>

                <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-1">
                  <span className="text-[10px] font-bold text-orange-600 block uppercase">Cơ Nạc (SMM)</span>
                  <div className="text-lg font-black text-orange-600 font-mono">{healthProfile?.smm || 32.5} <span className="text-xs font-medium">kg</span></div>
                  <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded block">+1.4 kg cơ</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Mỡ (PBF)</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{healthProfile?.pbf || 17.8}%</div>
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded block">Chuẩn VĐV</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">Mục tiêu hiện tại:</span>
                <p className="text-slate-600 text-[11px] leading-relaxed font-medium">"{healthProfile?.fitnessGoals}"</p>
              </div>
            </div>

            {/* Thẻ Gói tập & Quyền lợi VIP */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">
                  MEMBERSHIP PASS
                </span>
                <span className="text-xs font-bold text-slate-400">Còn {activePlan?.remainingDays || 320} ngày</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{activePlan?.name || 'Gói FPT Pickleball Pass & VIP Diamond'}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Số buổi PT 1:1 còn lại: <strong className="text-orange-400 font-mono font-bold">{activePlan?.remainingPTSessions || 8} buổi</strong></p>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7 cols): Cửa Sổ AI Chat Assistant */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[620px] overflow-hidden">
            
            {/* Header Cửa Sổ Chat */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/30">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">
                    FPT Sports Center AI Assistant
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">
                    Hệ thống hỏi đáp tự động • Phản hồi tức thì 24/7
                  </p>
                </div>
              </div>

              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold uppercase">
                Active
              </span>
            </div>

            {/* Thanh Gợi Ý Cụm Từ Nhanh */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.label)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-xs text-slate-700 font-bold whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Danh Sách Tin Nhắn Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                      m.sender === 'user'
                        ? 'bg-orange-500 text-white font-medium rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-normal'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{m.time}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
                  <span>AI Assistant đang tra cứu dữ liệu & soạn câu trả lời...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Khung Nhập Tin Nhắn */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi AI về lịch tập, bài tập, dịch vụ hoặc quy định hủy ca..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-orange-500 bg-slate-50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Gửi</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}