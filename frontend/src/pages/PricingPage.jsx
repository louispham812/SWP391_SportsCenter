import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// DANH MỤC 30 BỘ MÔN THỂ THAO
const ALL_30_SPORTS_PACKAGES = [
  {
    id: 1,
    category: 'racket',
    title: 'Pickleball Clinic & Match Pass',
    tag: '10 Buổi · 30 Ngày',
    icon: 'sports_tennis',
    desc: 'Huấn luyện chiến thuật đánh đơn/đôi và cọ xát thực chiến có trọng tài.',
    priceOriginal: '2.500.000 ₫',
    priceSilver: '2.250.000 ₫',
    priceGold: '2.000.000 ₫',
    priceDiamond: '1.625.000 ₫',
    features: ['HLV chuyên nghiệp chứng chỉ PPR', 'Sân có mái che chuẩn USAPA', 'Ưu đãi đặt sân kèm đến -50%'],
  },
  {
    id: 2,
    category: 'racket',
    title: 'Tennis High-Performance',
    tag: 'Khóa 12 Buổi',
    icon: 'sports_baseball',
    desc: 'Tập trung chỉnh đòn Forehand/Backhand uy lực và kỹ năng giao bóng thi đấu.',
    priceOriginal: '6.800.000 ₫',
    priceSilver: '6.120.000 ₫',
    priceGold: '5.440.000 ₫',
    priceDiamond: '4.420.000 ₫',
    features: ['HLV 1 kèm 1 theo sát từng pha bóng', 'Đo tốc độ phát bóng bằng AI camera', 'Mặt sân Plexipave chuẩn Grand Slam'],
  },
  {
    id: 3,
    category: 'racket',
    title: 'Cầu Lông Chuyên Sâu Yonex',
    tag: 'Khóa 12 Buổi',
    icon: 'sports_handball',
    desc: 'Rèn luyện bộ chân di chuyển linh hoạt, đập bóng cầu cao sâu và phòng thủ.',
    priceOriginal: '2.200.000 ₫',
    priceSilver: '1.980.000 ₫',
    priceGold: '1.760.000 ₫',
    priceDiamond: '1.430.000 ₫',
    features: ['Thảm Yonex đúc nguyên khối', 'Trần cao 12m cản gió tuyệt đối', 'Cung cấp cầu tập tiêu chuẩn'],
  },
  {
    id: 4,
    category: 'racket',
    title: 'Bóng Rổ Skill Academy',
    tag: 'Khóa 10 Buổi',
    icon: 'sports_basketball',
    desc: 'Cải thiện nhịp nhồi bóng, tư thế ném 3 điểm và tư duy phối hợp chiến thuật.',
    priceOriginal: '2.800.000 ₫',
    priceSilver: '2.520.000 ₫',
    priceGold: '2.240.000 ₫',
    priceDiamond: '1.820.000 ₫',
    features: ['Sàn gỗ Maple tiêu chuẩn FIBA', 'Bảng rổ kính cường lực kéo nhún', 'Đấu tập cọ xát hàng tuần'],
  },
  {
    id: 5,
    category: 'racket',
    title: 'Bóng Bàn ITTF Master',
    tag: 'Khóa 10 Buổi',
    icon: 'sports_tennis',
    desc: 'Kỹ thuật gò bóng, xoáy lên, xoáy xuống và bài tập phản xạ với máy bắn bóng.',
    priceOriginal: '1.900.000 ₫',
    priceSilver: '1.710.000 ₫',
    priceGold: '1.520.000 ₫',
    priceDiamond: '1.235.000 ₫',
    features: ['Bàn Double Fish thi đấu', 'Máy bắn bóng tự động chỉnh độ xoáy', 'HLV kiện tướng quốc gia'],
  },
  {
    id: 6,
    category: 'water',
    title: 'Bơi Lội Bốn Mùa Chuyên Sâu',
    tag: 'Vé Tháng 30 Lượt',
    icon: 'pool',
    desc: 'Tập luyện sức bền tim mạch, cải thiện nhịp thở và hoàn thiện kỹ thuật bơi.',
    priceOriginal: '1.800.000 ₫',
    priceSilver: '1.620.000 ₫',
    priceGold: '1.440.000 ₫',
    priceDiamond: '1.170.000 ₫',
    features: ['Bể bơi điện phân muối khoáng', 'Làn bơi 50m chuẩn Olympic', 'Chỉnh kỹ thuật sải tay & hơi thở'],
  },
  {
    id: 7,
    category: 'water',
    title: 'Chèo Thuyền Kayak & SUP Pass',
    tag: 'Gói 8 Lượt Chèo',
    icon: 'rowing',
    desc: 'Thư giãn outdoor trên hồ sinh thái, rèn luyện cơ vai và giữ thăng bằng.',
    priceOriginal: '1.500.000 ₫',
    priceSilver: '1.350.000 ₫',
    priceGold: '1.200.000 ₫',
    priceDiamond: '975.000 ₫',
    features: ['Trang bị ván SUP & Kayak đôi', 'Áo phao an toàn chuẩn cứu hộ', 'Đội cứu hộ túc trực 24/7'],
  },
  {
    id: 8,
    category: 'water',
    title: 'Thủy Liệu Pháp Jacuzzi Recovery',
    tag: 'Vé Tháng Không Giới Hạn',
    icon: 'hot_tub',
    desc: 'Hệ thống vòi phun nước áp lực cao giúp massage thư giãn và giảm đau mỏi cơ.',
    priceOriginal: '1.200.000 ₫',
    priceSilver: '1.080.000 ₫',
    priceGold: '960.000 ₫',
    priceDiamond: '780.000 ₫',
    features: ['Bể sục nóng lạnh luân phiên', 'Tăng cường lưu thông tuần hoàn máu', 'Không gian yên tĩnh VIP'],
  },
  {
    id: 9,
    category: 'water',
    title: 'Bơi Nghệ Thuật & Bơi Ngửa',
    tag: 'Khóa 10 Buổi',
    icon: 'water',
    desc: 'Luyện tập kỹ thuật bơi ngửa, bơi bướm và khả năng kiểm soát nhịp thở dưới nước.',
    priceOriginal: '2.400.000 ₫',
    priceSilver: '2.160.000 ₫',
    priceGold: '1.920.000 ₫',
    priceDiamond: '1.560.000 ₫',
    features: ['HLV kèm nhóm tối đa 4 người', 'Bể bơi duy trì 30°C quanh năm', 'Đo dung tích phổi định kỳ'],
  },
  {
    id: 10,
    category: 'fitness',
    title: 'Personal Trainer Gym 1-on-1',
    tag: 'Gói 12 Buổi PT',
    icon: 'fitness_center',
    desc: 'Lộ trình tăng cơ giảm mỡ cá nhân hóa, chỉnh form bài tập chuẩn an toàn.',
    priceOriginal: '4.800.000 ₫',
    priceSilver: '4.320.000 ₫',
    priceGold: '3.840.000 ₫',
    priceDiamond: '3.120.000 ₫',
    features: ['HLV sở hữu chứng chỉ NASM', 'Đo InBody định kỳ hàng tuần', 'Thiết kế thực đơn dinh dưỡng riêng'],
  },
  {
    id: 11,
    category: 'fitness',
    title: 'Spinning RPM Cycling Pass',
    tag: 'Vé Tháng 15 Lượt',
    icon: 'directions_bike',
    desc: 'Đạp xe trong nhà trên nền nhạc sôi động giúp đốt cháy đến 800 Calo/giờ.',
    priceOriginal: '1.600.000 ₫',
    priceSilver: '1.440.000 ₫',
    priceGold: '1.280.000 ₫',
    priceDiamond: '1.040.000 ₫',
    features: ['Xe đạp Stages SC3 cao cấp', 'Hệ thống âm thanh ánh sáng chill', 'Đo nhịp tim Real-time'],
  },
  {
    id: 12,
    category: 'fitness',
    title: 'CrossFit Sức Mạnh Liên Hoàn',
    tag: 'Khóa 12 Buổi',
    icon: 'fitness_center',
    desc: 'Bài tập đa khớp cường độ cao với lốp xe kéo, tạ ấm Kettlebell và xà đơn.',
    priceOriginal: '2.900.000 ₫',
    priceSilver: '2.610.000 ₫',
    priceGold: '2.320.000 ₫',
    priceDiamond: '1.885.000 ₫',
    features: ['Sân Crossfit Outdoor thoáng mát', 'HLV theo sát nhịp tim & sức bền', 'Tăng lực bộc phát thể chất'],
  },
  {
    id: 13,
    category: 'mindbody',
    title: 'Yoga & Pilates Reformer',
    tag: 'Gói 15 Buổi',
    icon: 'self_improvement',
    desc: 'Tái định hình cột sống, kích hoạt nhóm cơ lõi sâu và phục hồi chức năng.',
    priceOriginal: '3.200.000 ₫',
    priceSilver: '2.880.000 ₫',
    priceGold: '2.560.000 ₫',
    priceDiamond: '2.080.000 ₫',
    features: ['Máy Pilates Allegro 2 từ Đức', 'Lớp giới hạn tối đa 6 học viên', 'Phục hồi & trị liệu khớp'],
  },
  {
    id: 14,
    category: 'mindbody',
    title: 'Zumba & Dance Fitness Pass',
    tag: 'Vé Tháng 20 Lượt',
    icon: 'music_note',
    desc: 'Vũ điệu La-tinh sôi động giúp xả stress, cải thiện vóc dáng và giải phóng năng lượng.',
    priceOriginal: '1.400.000 ₫',
    priceSilver: '1.260.000 ₫',
    priceGold: '1.120.000 ₫',
    priceDiamond: '910.000 ₫',
    features: ['Studio rộng 200m² cách âm', 'HLV Zumba International', 'Không khí vui vẻ kết nối'],
  },
  {
    id: 15,
    category: 'mindbody',
    title: 'Aerobic & Thể Dục Nhịp Điệu',
    tag: 'Vé Tháng 20 Lượt',
    icon: 'fitness_center',
    desc: 'Bài tập nhịp điệu liên tục giúp săn chắc vóc dáng và cải thiện hệ tuần hoàn.',
    priceOriginal: '1.200.000 ₫',
    priceSilver: '1.080.000 ₫',
    priceGold: '960.000 ₫',
    priceDiamond: '780.000 ₫',
    features: ['Chỉnh tư thế chuẩn dẻo dai', 'Nhạc tập bắt tai tạo động lực', 'Tăng sức bền hệ hô hấp'],
  },
  {
    id: 16,
    category: 'combat',
    title: 'Boxing & Muay Thai Kick',
    tag: 'Khóa 16 Buổi',
    icon: 'sports_mma',
    desc: 'Khai phóng phản xạ, đốt calo tối đa với sàn đấu tiêu chuẩn và găng Everlast.',
    priceOriginal: '3.600.000 ₫',
    priceSilver: '3.240.000 ₫',
    priceGold: '2.880.000 ₫',
    priceDiamond: '2.340.000 ₫',
    features: ['Ring thi đấu chuẩn WBA/WBC', 'HLV đai đen & kiện tướng', 'Trang bị bảo hộ đầu & băng quấn'],
  },
  {
    id: 17,
    category: 'combat',
    title: 'Võ Thuật Vovinam & Taekwondo',
    tag: 'Khóa 12 Buổi',
    icon: 'sports_martial_arts',
    desc: 'Rèn luyện võ đạo, kỹ thuật đòn chân và tinh thần kiên cường của sinh viên.',
    priceOriginal: '1.800.000 ₫',
    priceSilver: '1.620.000 ₫',
    priceGold: '1.440.000 ₫',
    priceDiamond: '1.170.000 ₫',
    features: ['Thảm EVA tiêu chuẩn thi đấu', 'Sư phụ có nhiều năm kinh nghiệm', 'Cấp chứng nhận thăng đai'],
  },
  {
    id: 18,
    category: 'combat',
    title: 'Cardio Kickboxing Group',
    tag: 'Vé Tháng 12 Lượt',
    icon: 'sports_mma',
    desc: 'Kết hợp đòn đấm Boxing và đá Muay Thai trên nền nhạc giúp đốt mỡ thần tốc.',
    priceOriginal: '1.700.000 ₫',
    priceSilver: '1.530.000 ₫',
    priceGold: '1.360.000 ₫',
    priceDiamond: '1.105.000 ₫',
    features: ['Trang bị bao cát Fairtex', 'Tăng khả năng tự vệ phản xạ', 'Đốt cháy tới 700 Calo/buổi'],
  },
  {
    id: 19,
    category: 'other',
    title: 'Golf 3D Trackman Simulator',
    tag: '10 Buổi · Trackman 4',
    icon: 'golf_course',
    desc: 'Phân tích góc nghiêng Swing, tốc độ xoáy bóng qua cảm biến Trackman 4.',
    priceOriginal: '5.500.000 ₫',
    priceSilver: '4.950.000 ₫',
    priceGold: '4.400.000 ₫',
    priceDiamond: '3.575.000 ₫',
    features: ['Mô phỏng 200+ sân PGA Tour', 'HLV PGA chỉnh dáng Swing', 'Không gian VIP Lounge riêng tư'],
  },
  {
    id: 20,
    category: 'other',
    title: 'Bắn Cung Target Center',
    tag: 'Khóa 10 Buổi',
    icon: 'adjust',
    desc: 'Rèn luyện sự tập trung, nhịp thở điềm tĩnh và độ chính xác ở cự ly 10m - 25m.',
    priceOriginal: '2.100.000 ₫',
    priceSilver: '1.890.000 ₫',
    priceGold: '1.680.000 ₫',
    priceDiamond: '1.365.000 ₫',
    features: ['Trang bị cung trợ lực & cung 1 dây', 'Bia bắn đạt chuẩn Olympic', 'Giám sát an toàn tuyệt đối'],
  },
  {
    id: 21,
    category: 'other',
    title: 'Leo Núi Indoor Climbing',
    tag: 'Vé Tháng Không Giới Hạn',
    icon: 'hiking',
    desc: 'Thử thách độ cao 15m với nhiều cấp độ bám đá rèn luyện sức bền bàn tay.',
    priceOriginal: '1.600.000 ₫',
    priceSilver: '1.440.000 ₫',
    priceGold: '1.280.000 ₫',
    priceDiamond: '1.040.000 ₫',
    features: ['Dây tự động hãm bảo hiểm', 'Đệm khí bảo hộ dày 1m', 'Thay đổi tuyến đường bám hàng tuần'],
  },
  {
    id: 22,
    category: 'racket',
    title: 'Bóng Đá Sân 7 Cỏ Kim Cương',
    tag: 'Gói Thuê 5 Trận',
    icon: 'sports_soccer',
    desc: 'Sân cỏ nhân tạo cao cấp chống trượt, trang bị dàn đèn 600 Lux thi đấu.',
    priceOriginal: '3.500.000 ₫',
    priceSilver: '3.150.000 ₫',
    priceGold: '2.800.000 ₫',
    priceDiamond: '2.275.000 ₫',
    features: ['Cung cấp nước uống & bóng thi đấu', 'Hỗ trợ trọng tài bắt chính', 'Khăn lạnh phục vụ tại sân'],
  },
  {
    id: 23,
    category: 'racket',
    title: 'Bóng Chuyền Sàn Gỗ Arena',
    tag: 'Gói Thuê 10 Giờ Tập',
    icon: 'sports_volleyball',
    desc: 'Sân đấu chuẩn FIBA trang bị lưới điều chỉnh độ cao linh hoạt cho nam & nữ.',
    priceOriginal: '2.600.000 ₫',
    priceSilver: '2.340.000 ₫',
    priceGold: '2.080.000 ₫',
    priceDiamond: '1.690.000 ₫',
    features: ['Sàn đệm gỗ giảm chấn thương', 'Bảng điểm điện tử cảm ứng', 'Tủ đồ riêng tư cho 2 đội'],
  },
  {
    id: 24,
    category: 'fitness',
    title: 'Điền Kinh & Track Running',
    tag: 'Vé Tháng Chạy Đêm',
    icon: 'directions_run',
    desc: 'Đường chạy Tartan 400m 8 làn chống chấn thương khớp gối tuyệt đối.',
    priceOriginal: '900.000 ₫',
    priceSilver: '810.000 ₫',
    priceGold: '720.000 ₫',
    priceDiamond: '585.000 ₫',
    features: ['Hệ thống đèn LED chiếu sáng 24/7', 'Trạm tiếp nước điện giải miễn phí', 'Tủ gửi đồ thông minh'],
  },
  {
    id: 25,
    category: 'other',
    title: 'Bida Pool & Snooker Pro',
    tag: 'Gói 20 Giờ Chơi',
    icon: 'sports_bar',
    desc: 'Không gian giải trí cao cấp với 12 bàn Bida Aileex chuẩn thi đấu.',
    priceOriginal: '1.800.000 ₫',
    priceSilver: '1.620.000 ₫',
    priceGold: '1.440.000 ₫',
    priceDiamond: '1.170.000 ₫',
    features: ['Bóng Aramith chuẩn quốc tế', 'Gậy cơ nhập khẩu cao cấp', 'Phục vụ nước uống tại bàn'],
  },
  {
    id: 26,
    category: 'mindbody',
    title: 'Cờ Vua & Mind Sports',
    tag: 'Vé Tháng CLB Trí Tuệ',
    icon: 'extension',
    desc: 'Phòng tập yên tĩnh trang bị đồng hồ đếm giờ DGT cho các kỳ thủ cờ vua.',
    priceOriginal: '800.000 ₫',
    priceSilver: '720.000 ₫',
    priceGold: '640.000 ₫',
    priceDiamond: '520.000 ₫',
    features: ['Bàn cờ gỗ cao cấp chuẩn FIDE', 'Giao lưu cùng Kiện tướng', 'Máy lạnh & Wifi tốc độ cao'],
  },
  {
    id: 27,
    category: 'other',
    title: 'Sân Nhảy Xà & Nhảy Xa',
    tag: 'Gói 10 Buổi Luyện',
    icon: 'sprint',
    desc: 'Hố cát mịn xốp kết hợp xà nhảy cao điều chỉnh được độ cao chính xác.',
    priceOriginal: '1.100.000 ₫',
    priceSilver: '990.000 ₫',
    priceGold: '880.000 ₫',
    priceDiamond: '715.000 ₫',
    features: ['Mặt sân giậm nhảy Tartan', 'Thước đo tiêu chuẩn điền kinh', 'HLV giám sát an toàn'],
  },
  {
    id: 28,
    category: 'other',
    title: 'Trận Địa Bắn Súng Sơn Paintball',
    tag: 'Gói 1 Trận (200 Viên)',
    icon: 'track_changes',
    desc: 'Trận địa chướng ngại vật sinh động 1.000m² rèn luyện tinh thần đồng đội.',
    priceOriginal: '2.000.000 ₫',
    priceSilver: '1.800.000 ₫',
    priceGold: '1.600.000 ₫',
    priceDiamond: '1.300.000 ₫',
    features: ['Trang bị giáp & nón bảo vệ', 'Súng hơi nén khí chuẩn', 'Trọng tài điều hành trận đấu'],
  },
  {
    id: 29,
    category: 'other',
    title: 'Inline Skate & Trượt Patin',
    tag: 'Khóa 8 Buổi Cơ Bản',
    icon: 'ice_skating',
    desc: 'Sân trượt Epoxy phẳng mịn trang bị nón và bọc gối an toàn cho người mới.',
    priceOriginal: '1.500.000 ₫',
    priceSilver: '1.350.000 ₫',
    priceGold: '1.200.000 ₫',
    priceDiamond: '975.000 ₫',
    features: ['Mượn giày trượt miễn phí', 'HLV hướng dẫn giữ thăng bằng', 'Sân tập có mái che'],
  },
  {
    id: 30,
    category: 'fitness',
    title: 'Sasuke Obstacle Challenge',
    tag: 'Vé Tháng Vượt Chướng Ngại',
    icon: 'sports_score',
    desc: 'Thử thách đu xà, vượt tường cong 4m và cầu thăng bằng rèn luyện ý chí.',
    priceOriginal: '1.700.000 ₫',
    priceSilver: '1.530.000 ₫',
    priceGold: '1.360.000 ₫',
    priceDiamond: '1.105.000 ₫',
    features: ['Đệm khí an toàn toàn khu vực', 'Đo thời gian hoàn thành tự động', 'Thử thách thể lực mỗi tuần'],
  },
];

export default function PricingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sportsSectionRef = useRef(null);

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [highlightedSportId, setHighlightedSportId] = useState(null);

  // 3 Hạng thẻ thành viên
  const membershipTiers = [
    {
      name: 'Silver Member',
      tag: 'Phổ Biến',
      priceMonthly: '1.490.000',
      priceAnnual: '1.190.000',
      desc: 'Dành cho người mới bắt đầu muốn duy trì thể lực với đầy đủ tiện ích cơ bản.',
      benefits: [
        'Toàn quyền khu vực Gym & Fitness 24/7',
        'Tủ đồ cá nhân thông minh & Khăn tập cao cấp',
        'Giảm 10% khi đăng ký lớp thể thao chuyên biệt',
        'Giảm 15% khi thuê sân Pickleball & Tennis',
        '01 buổi đo InBody 770 & tư vấn thể trạng ban đầu',
      ],
      isPopular: false,
      btnColor: 'bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold',
    },
    {
      name: 'Gold Member',
      tag: 'Khuyên Dùng · Best Value',
      priceMonthly: '2.790.000',
      priceAnnual: '2.230.000',
      desc: 'Đầy đủ đặc quyền luyện tập toàn diện cùng dịch vụ xông hơi & phục hồi 5 sao.',
      benefits: [
        'Tất cả quyền lợi của hạng Silver',
        'Sử dụng không giới hạn Bể bơi 4 mùa & Xông hơi Sauna',
        'Giảm 20% khi đăng ký lớp thể thao chuyên biệt',
        'Giảm 30% khi thuê sân giờ cao điểm',
        '02 buổi tập kèm 1-1 cùng Master Coach',
        'Đo InBody định kỳ 2 tuần/lần',
      ],
      isPopular: true,
      btnColor: 'bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-md shadow-orange-500/20',
    },
    {
      name: 'Diamond VIP',
      tag: 'Đặc Quyền Tối Cao',
      priceMonthly: '4.490.000',
      priceAnnual: '3.590.000',
      desc: 'Trải nghiệm đỉnh cao với trợ lý riêng và đặc quyền phòng VIP khép kín.',
      benefits: [
        'Toàn quyền truy cập tất cả tiện ích & phòng tập VIP',
        'Miễn phí 4 lượt chơi Golf 3D Trackman/tháng',
        'Giảm 35% tất cả các lớp thể thao chuyên sâu',
        'Giảm 50% phí thuê sân Pickleball & Tennis',
        '04 buổi tập kèm 1-1 cùng Master Coach/tháng',
        'Phục vụ đồ uống dinh dưỡng & quầy Protein Bar',
      ],
      isPopular: false,
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white font-bold',
    },
  ];

  // Lọc danh sách gói môn
  const filteredSports =
    selectedCategory === 'all'
      ? ALL_30_SPORTS_PACKAGES
      : ALL_30_SPORTS_PACKAGES.filter((p) => p.category === selectedCategory);

  const itemsPerPage = 3;
  const totalSlides = Math.ceil(filteredSports.length / itemsPerPage);

  // Tự động tìm môn được chọn từ trang trước, bật slide chứa môn đó & cuộn màn hình xuống
  useEffect(() => {
    if (location.state?.sportName) {
      const searchName = location.state.sportName.toLowerCase();
      const matchIndex = ALL_30_SPORTS_PACKAGES.findIndex(
        (sp) =>
          sp.title.toLowerCase().includes(searchName) ||
          searchName.includes(sp.title.toLowerCase()) ||
          (searchName.split(' ')[0].length > 2 && sp.title.toLowerCase().includes(searchName.split(' ')[0]))
      );

      if (matchIndex !== -1) {
        setSelectedCategory('all');
        const slideIdx = Math.floor(matchIndex / itemsPerPage);
        setCurrentSlideIndex(slideIdx);
        setHighlightedSportId(ALL_30_SPORTS_PACKAGES[matchIndex].id);

        setTimeout(() => {
          if (sportsSectionRef.current) {
            sportsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [location.state]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentSlideIndex(0);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const visibleSports = filteredSports.slice(
    currentSlideIndex * itemsPerPage,
    (currentSlideIndex + 1) * itemsPerPage
  );

  // CHUYỂN HƯỚNG THẲNG SANG TRANG ĐĂNG NHẬP
  const handleLoginRedirect = (packageName) => {
    navigate('/login', { state: { selectedPackage: packageName } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-orange-600 font-extrabold px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                  BẢNG GIÁ NIÊM YẾT
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  OLYMPIC TRAINING TIERS
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl uppercase tracking-tight text-slate-900 font-black">
                BẢNG GIÁ DỊCH VỤ & <span className="text-orange-500">THẺ HỘI VIÊN</span>
              </h1>
              <p className="text-base text-slate-600 max-w-2xl font-medium">
                Lựa chọn gói hội viên phù hợp với lịch trình tập luyện của bạn. Đăng nhập ngay để truy cập lịch tập, theo dõi dịch vụ và kết nối với huấn luyện viên.
              </p>
            </div>

            {/* Toggle Billing (Monthly / Annual) */}
            <div className="p-1 rounded-2xl bg-white border border-slate-200 flex items-center shadow-sm self-start lg:self-auto">
              <button
                onClick={() => setIsAnnual(false)}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isAnnual
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAnnual
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Theo năm</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-orange-600 uppercase font-extrabold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Section 1: 3 Hạng thẻ thành viên */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
              <span className="material-symbols-outlined text-orange-500 text-[26px]">
                workspace_premium
              </span>
              <h2 className="text-xl uppercase text-slate-900 font-black">
                3 Hạng Thẻ Hội Viên Trung Tâm (Membership Tiers)
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {membershipTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl bg-white p-7 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:shadow-xl ${
                    tier.isPopular
                      ? 'border-2 border-orange-500 ring-4 ring-orange-500/10'
                      : 'border border-slate-200'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                      {tier.tag}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-black text-slate-900">
                        {tier.name}
                      </h3>
                      {!tier.isPopular && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold uppercase border border-orange-200">
                          {tier.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">{tier.desc}</p>

                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900">
                        {isAnnual ? tier.priceAnnual : tier.priceMonthly} ₫
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/ tháng</span>
                    </div>

                    <div className="space-y-3 mb-8 pt-4 border-t border-slate-100">
                      <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                        Đặc quyền bao gồm:
                      </span>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                        {tier.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px] text-orange-500 shrink-0">
                              check_circle
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoginRedirect(tier.name)}
                    type="button"
                    className={`w-full py-3 rounded-xl uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${tier.btnColor}`}
                  >
                    <span>Đăng Nhập Để Đăng Ký</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle Benefit Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-50/50 to-white border-2 border-orange-200 mb-12 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-orange-600 text-[22px]">
                    card_giftcard
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-orange-600 font-extrabold">
                    ĐẶC QUYỀN HỘI VIÊN (BUNDLE BENEFIT)
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Sở hữu Thẻ Hội Viên để nhận chiết khấu lên đến 35% cho tất cả các môn & sân bãi
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Hội viên Silver: -10% lớp / -15% sân • Hội viên Gold: -20% lớp / -30% sân • Hội viên Diamond: -35% lớp / -50% sân.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                  Silver: -10%
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-orange-100 text-orange-800 text-xs font-bold shadow-sm">
                  Gold: -20%
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-sm">
                  Diamond: -35%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Gói Thể Thao Bán Theo 30 Bộ Môn */}
          <div ref={sportsSectionRef} className="mb-16 scroll-mt-28">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-orange-600 font-extrabold px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                  30 KHÓA TẬP & THẺ LƯỢT CHUYÊN SÂU
                </span>
                <h2 className="text-2xl uppercase tracking-tight text-slate-900 font-black mt-2">
                  Gói Thể Thao Chuyên Biệt ({ALL_30_SPORTS_PACKAGES.length} Môn)
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
                  Chương trình đào tạo chuyên sâu và thẻ lượt dành riêng cho từng bộ môn thể thao với HLV chuyên nghiệp.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'racket', label: 'Môn Vợt & Bóng' },
                  { id: 'water', label: 'Dưới Nước' },
                  { id: 'fitness', label: 'Gym & Fitness' },
                  { id: 'mindbody', label: 'Yoga & Pilates' },
                  { id: 'combat', label: 'Võ Thuật' },
                  { id: 'other', label: 'Khác & Giả Lập' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Carousel 30 Gói Bộ Môn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300">
              {visibleSports.map((sp) => {
                const isHighlighted = sp.id === highlightedSportId;

                return (
                  <div
                    key={sp.id}
                    className={`flex flex-col justify-between rounded-2xl bg-white p-6 transition-all duration-500 group relative ${
                      isHighlighted
                        ? 'border-2 border-orange-500 ring-4 ring-orange-500/30 scale-105 shadow-2xl z-10'
                        : 'border border-slate-200 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    {isHighlighted && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                        🎯 Môn Bạn Quan Tâm
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 font-bold">
                          {sp.tag}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-slate-700 transition-colors">
                          <span className="material-symbols-outlined text-[22px]">{sp.icon}</span>
                        </div>
                      </div>

                      <h3 className="text-lg uppercase text-slate-900 font-black mb-1 group-hover:text-orange-600 transition-colors">
                        {sp.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 font-medium line-clamp-2">{sp.desc}</p>

                      {/* Hộp so sánh giá */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 space-y-1.5 text-xs font-medium">
                        <div className="flex justify-between text-slate-400">
                          <span>Giá khách lẻ:</span>
                          <span className="line-through font-semibold">{sp.priceOriginal}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Hội viên Silver (-10%):</span>
                          <span className="font-semibold">{sp.priceSilver}</span>
                        </div>
                        <div className="flex justify-between text-orange-600 font-bold">
                          <span>Hội viên Gold (-20%):</span>
                          <span className="text-sm text-slate-900 font-black">{sp.priceGold}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-emerald-700 font-extrabold">
                          <span>Hội viên Diamond (-35%):</span>
                          <span>{sp.priceDiamond}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-700 mb-6 font-medium">
                        {sp.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-orange-500">
                              check_circle
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleLoginRedirect(sp.title)}
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-900 text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Đăng Nhập Để Đăng Ký</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* THANH ĐIỀU HƯỚNG CAROUSEL SLIDER */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={prevSlide}
                  type="button"
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-orange-500 hover:border-orange-500 hover:text-white text-slate-700 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  aria-label="Trang trước"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-slate-200/80 shadow-sm max-w-xs overflow-x-auto scrollbar-none">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      type="button"
                      aria-label={`Chuyển tới slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full cursor-pointer shrink-0 ${
                        currentSlideIndex === idx
                          ? 'w-7 h-2.5 bg-orange-500'
                          : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextSlide}
                  type="button"
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-orange-500 hover:border-orange-500 hover:text-white text-slate-700 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  aria-label="Trang sau"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}