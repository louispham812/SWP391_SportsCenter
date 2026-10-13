import React, { useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

export default function MemberAIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Chào Minh Anh! Tôi là Trợ Lý Thể Thao AI của Elite Sports Center. Tôi có thể giúp bạn gợi ý bài tập theo mục tiêu, giải đáp thời khóa biểu các lớp, hoặc phân tích chỉ số thể trạng InBody mới nhất. Bạn muốn tìm hiểu gì hôm nay?',
      time: '08:30 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'Gợi ý bài tập bổ trợ cho Pickleball',
    'Thực đơn tăng cơ giảm mỡ cho tuần này',
    'Lịch lớp Yoga phục hồi chiều nay',
    'Phân tích chỉ số InBody 18/11',
  ];

  const [msgCounter, setMsgCounter] = useState(2);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const nextUserMsgId = msgCounter + 1;
    const nextAiMsgId = msgCounter + 2;
    setMsgCounter(nextAiMsgId);

    const userMsg = {
      id: nextUserMsgId,
      sender: 'user',
      text: query,
      time: '08:42 AM',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // AI Response Simulation
    setTimeout(() => {
      let aiReply = '';
      const q = query.toLowerCase();

      if (q.includes('pickleball')) {
        aiReply =
          'Dựa trên mục tiêu tăng phản xạ và hạn chế chấn thương cổ chân cho Pickleball:\n1. 3 hiệp Agility Ladder Drills (Bộ pháp thang dây - 30s/hiệp)\n2. 4 hiệp Calf Raises (Nhón bắp chuối với tạ 10kg x 15 lần)\n3. 3 hiệp Medicine Ball Rotational Throws (Ném bóng tạ xoay hông tăng lực đánh - 12 lần/bên)\nKhuyến nghị: Nghỉ ngơi 45s giữa các hiệp và uống nước điện giải bù khoáng!';
      } else if (q.includes('inbody') || q.includes('chỉ số')) {
        aiReply =
          'Phân tích đo InBody ngày 18/11 của bạn:\n• Cân nặng: 64.2kg (-2.8kg so với tháng trước)\n• Khối lượng cơ nạc (SMM): 32.5kg (+1.4kg - Rất xuất sắc!)\n• Tỷ lệ mỡ (PBF): 17.8% (Đạt ngưỡng tiêu chuẩn VĐV thể thao)\nHLV Lê Anh Tuấn khuyến nghị bạn duy trì mức calo 2.100 kcal/ngày với 130g Protein để tiếp tục phát triển cơ nạc.';
      } else if (q.includes('yoga') || q.includes('lịch')) {
        aiReply =
          'Lớp Yoga hôm nay tại Studio 02:\n• 18:00 - 19:30: Yoga Phục Hồi Thể Lực (HLV Vũ Thu Hà) - Hiện còn 3 slot.\nBạn có muốn tôi giữ chỗ ngay cho bạn không?';
      } else {
        aiReply =
          'Cảm ơn câu hỏi của bạn! Dựa trên hồ sơ thể trạng của bạn (#ELT-8924), hệ thống khuyên bạn nên kết hợp 3 buổi Cardio cường độ vừa và 2 buổi tập kháng lực mỗi tuần để tối ưu hóa hiệu suất thể thao.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: nextAiMsgId,
          sender: 'ai',
          text: aiReply,
          time: '08:42 AM',
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(80,102,0,0.6)] animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                FLOW 5 & FLOW 6: AI ATHLETIC ASSISTANT
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">ID: #ELT-8924</span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-primary">
              Tiến Độ Rèn Luyện & Trợ Lý Thể Thao AI
            </h1>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-2 self-start sm:self-auto">
            <span className="material-symbols-outlined text-secondary text-[18px]">
              calendar_today
            </span>
            <span>Đo InBody gần nhất: 18/11/2026</span>
          </div>
        </div>

        {/* Layout Grid: 7 cols Telemetry / 5 cols AI Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (7 cols): Chỉ số InBody & Kế hoạch tập luyện */}
          <div className="lg:col-span-7 space-y-6">
            {/* 3 Thẻ chỉ số sinh trắc học */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cân nặng */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-500">Cân Nặng</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    scale
                  </span>
                </div>
                <div className="text-3xl font-headline-xl font-bold text-primary">
                  64.2 <span className="text-sm font-normal text-slate-500">kg</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-2">
                  <span className="material-symbols-outlined text-[14px]">trending_down</span>
                  <span>-2.8 kg (Giảm mỡ)</span>
                </div>
              </div>

              {/* Khối lượng cơ nạc */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-500">Cơ Nạc (SMM)</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    fitness_center
                  </span>
                </div>
                <div className="text-3xl font-headline-xl font-bold text-primary">
                  32.5 <span className="text-sm font-normal text-slate-500">kg</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-secondary mt-2">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>+1.4 kg (Tăng cơ)</span>
                </div>
              </div>

              {/* Tỷ lệ mỡ */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-500">Tỷ Lệ Mỡ (PBF)</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    pie_chart
                  </span>
                </div>
                <div className="text-3xl font-headline-xl font-bold text-primary">
                  17.8 <span className="text-sm font-normal text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-2">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Chuẩn Vận Động Viên</span>
                </div>
              </div>
            </div>

            {/* Giáo án tập luyện hiện tại */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-primary uppercase">
                    Kế Hoạch Rèn Luyện Tuần Này
                  </h3>
                  <p className="text-xs text-slate-500">
                    Được phân công bởi HLV Lê Anh Tuấn kết hợp gợi ý từ AI
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container text-primary font-bold text-xs">
                  Tuần 4 / 8
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    day: 'Thứ Ba',
                    title: 'Pickleball Chiến Thuật & Footwork',
                    duration: '90 phút',
                    status: 'Sắp diễn ra 18:00',
                    done: false,
                  },
                  {
                    day: 'Thứ Tư',
                    title: 'Gym Kháng Lực Thân Dưới (Leg Day)',
                    duration: '60 phút',
                    status: 'Chưa tập',
                    done: false,
                  },
                  {
                    day: 'Thứ Năm',
                    title: 'Yoga Phục Hồi Thể Lực & Cột Sống',
                    duration: '75 phút',
                    status: 'Đã hoàn thành',
                    done: true,
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      plan.done
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          plan.done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {plan.done ? '✓' : i + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          [{plan.day}] {plan.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Thời lượng: {plan.duration}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        plan.done
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): AI Chat Assistant */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
            {/* Header Chat */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold uppercase text-white">
                    Elite AI Coach Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Sẵn sàng hỗ trợ 24/7 (Gemini Powered)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Prompts Strip */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-secondary text-[11px] text-slate-700 whitespace-nowrap transition-colors font-medium shadow-2xs"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                      m.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce"></span>
                  <span>AI đang soạn câu trả lời...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về bài tập, lịch lớp, dinh dưỡng..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim disabled:opacity-50 text-primary flex items-center justify-center transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
