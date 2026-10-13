import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// DANH MỤC ĐỦ 30 BỘ MÔN THỂ THAO CHUYỂN PHÂN LOẠI DANH MỤC
const FULL_30_SPORTS = [
  {
    sportId: 1,
    name: 'Cụm Bơi Lội Olympic',
    slug: 'boi-loi',
    category: 'water',
    categoryName: 'Dưới Nước',
    subtitle: 'Hồ bơi 50m chuẩn quốc tế',
    description: 'Hệ thống lọc nước điện phân muối hiện đại, 10 làn bơi tiêu chuẩn cùng khu vực nhảy cầu chuyên nghiệp.',
    tag: 'Chuẩn Olympic',
    area: 'Khu Thể thao dưới nước',
    icon: 'pool',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 2,
    name: 'Pickleball Pro Clinic',
    slug: 'pickleball',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Cụm sân chuẩn USAPA',
    description: 'Mặt sân sơn Plexipave 8 lớp chống lóa, hệ thống đèn LED 500 Lux chuẩn thi đấu giải đấu chuyên nghiệp.',
    tag: 'HOT Trend',
    area: 'Cụm sân phía Tây',
    icon: 'sports_tennis',
    image: 'https://file.hstatic.net/200000060906/file/1_5ca9494b606042c3b792dd5b0080db4e.jpeg',
  },
  {
    sportId: 3,
    name: 'Tennis ITF High-Performance',
    slug: 'tennis',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Mặt sân đất nện & sân cứng',
    description: 'Trang bị AI Camera đo tốc độ phát bóng và xoáy bóng, dịch vụ trọng tài và nhặt bóng chuyên nghiệp.',
    tag: 'Đạt Chuẩn ITF',
    area: 'Cụm sân phía Tây',
    icon: 'sports_baseball',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 4,
    name: 'Gym & Crossfit Center',
    slug: 'gym-fitness',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Rèn luyện thể lực đỉnh cao',
    description: 'Trang thiết bị TechnoGym & Hammer Strength 100%, khu vực Powerlifting và Functional Training chuyên sâu.',
    tag: 'Tối tân 5★',
    area: 'Tầng 1 & 2 - Main Center',
    icon: 'fitness_center',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 5,
    name: 'Bóng Đá Sân 7 Cỏ Kim Cương',
    slug: 'bong-da',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Sân cỏ nhân tạo cao cấp',
    description: 'Hệ thống cỏ nhân tạo nhập khẩu chống trơn trượt, dàn đèn chiếu sáng 600 Lux chuẩn thi đấu giải SV FPT.',
    tag: 'Giải Đấu SV',
    area: 'Cụm sân phía Đông',
    icon: 'sports_soccer',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 6,
    name: 'Cầu Lông Nhà Thi Đấu',
    slug: 'cau-long',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Thảm Yonex 100% tiêu chuẩn',
    description: '12 sân cầu lông thảm cao su đúc nguyên khối chống chấn thương cổ chân, trần cao 12m cản gió tuyệt đối.',
    tag: 'Phổ Biến Nhất',
    area: 'Tòa nhà Arena',
    icon: 'sports_handball',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 7,
    name: 'Bóng Rổ Sàn Gỗ Maple',
    slug: 'bong-ro',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Sàn đệm giảm chấn NBA',
    description: 'Sân bóng rổ tiêu chuẩn FIBA trang bị bảng rổ kính cường lực lực kéo nhún tự động và bảng điểm điện tử.',
    tag: 'Sôi Động',
    area: 'Tòa nhà Arena',
    icon: 'sports_basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 8,
    name: 'Studio Yoga & Pilates Reformer',
    slug: 'yoga-pilates',
    category: 'mindbody',
    categoryName: 'Yoga & Pilates',
    subtitle: 'Cân bằng & Phục hồi cơ thể',
    description: 'Phòng tập cách âm cao cấp với máy Allegro 2 Reformer nhập khẩu Đức, giúp căn chỉnh cột sống và dẻo dai.',
    tag: 'Trị Liệu Cột Sống',
    area: 'Tầng 3 - Quiet Zone',
    icon: 'self_improvement',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 9,
    name: 'Boxing & Muay Thai Ring A',
    slug: 'boxing-mma',
    category: 'combat',
    categoryName: 'Võ Thuật',
    subtitle: 'Võ thuật đối kháng cường độ cao',
    description: 'Trang bị sàn đài Boxing tiêu chuẩn WBA, bao cát Fairtex cao cấp cùng dụng cụ bảo hộ an toàn tuyệt đối.',
    tag: 'Đốt Calo Cực Đỉnh',
    area: 'Khu Đấu Đài Combat',
    icon: 'sports_mma',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 10,
    name: 'Phòng Bắn Cung Trong Nhà',
    slug: 'ban-cung',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Rèn luyện sự tập trung & Điềm tĩnh',
    description: 'Cự ly bắn từ 10m đến 25m chuẩn tập luyện, trang bị cung trợ lực và cung một dây cho mọi trình độ.',
    tag: 'Tập Trung Cao Độ',
    area: 'Tầng B1 - Target Center',
    icon: 'adjust',
    image: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 11,
    name: 'Phòng Giả Lập Golf 3D Trackman',
    slug: 'golf-3d',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Công nghệ phân tích cú đánh AI',
    description: 'Hệ thống cảm biến Trackman 4 đo chính xác góc đánh, tốc độ bóng và mô phỏng 200+ sân Golf nổi tiếng thế giới.',
    tag: 'Công Nghệ 4.0',
    area: 'VIP Lounge',
    icon: 'golf_course',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 12,
    name: 'Võ Thuật Vovinam & Taekwondo',
    slug: 'vovinam',
    category: 'combat',
    categoryName: 'Võ Thuật',
    subtitle: 'Tinh hoa võ thuật sinh viên',
    description: 'Thảm tập EVA tiêu chuẩn thi đấu quốc gia, không gian thoáng rộng rèn luyện võ thuật truyền thống và võ đạo.',
    tag: 'Đặc Sản Sinh Viên',
    area: 'Nhà Võ Thuật Truyền Thống',
    icon: 'sports_martial_arts',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 13,
    name: 'Leo Núi Trong Nhà (Climbing Wall)',
    slug: 'leo-nui',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Thử thách độ cao & Sức bền',
    description: 'Bức tường leo cao 15m tích hợp đệm khí bảo hộ dầy 1m, tự động đu dây bảo hiểm an toàn 100%.',
    tag: 'Mạo Hiểm Thú Vị',
    area: 'Khu Thể Thao Mạo Hiểm',
    icon: 'hiking',
    image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 14,
    name: 'Spinning Class (Đạp Xe Trong Nhà)',
    slug: 'spinning',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Âm nhạc & Đốt mỡ bùng nổ',
    description: 'Xe đạp Stages SC3 cao cấp kết hợp hiệu ứng âm thanh ánh sáng nhịp điệu kích thích năng lượng tập luyện.',
    tag: 'Sôi Động 1000 Calo',
    area: 'Studio Đạp Xe Tầng 2',
    icon: 'directions_bike',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 15,
    name: 'Bóng Chuyền Sàn Gỗ Tiêu Chuẩn',
    slug: 'bong-chuyen',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Kỹ thuật đập bóng & Phản xạ',
    description: 'Sân đấu tiêu chuẩn trang bị lưới điều chỉnh độ cao linh hoạt cho cả nam và nữ thi đấu cọ xát.',
    tag: 'Đồng Đội Kỷ Luật',
    area: 'Nhà Thi Đấu Đa Năng',
    icon: 'sports_volleyball',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 16,
    name: 'Bóng Bàn Thi Đấu Quốc Tế',
    slug: 'bong-ban',
    category: 'racket',
    categoryName: 'Môn Vợt & Bóng',
    subtitle: 'Bàn Double Fish chuẩn ITTF',
    description: '10 bàn bóng bàn thi đấu trang bị hệ thống máy bắn bóng tự động phục vụ luyện tập kỹ thuật đơn và đôi.',
    tag: 'Phản Xạ Nhanh',
    area: 'Tầng 2 - Game Zone',
    icon: 'sports_tennis',
    image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 17,
    name: 'Điền Kinh & Chạy Bộ Track',
    slug: 'dien-kinh',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Đường chạy Tartan 400m',
    description: 'Mặt đường chạy phủ hạt nhựa Tartan chống chấn thương, phân làn chuyên nghiệp đạt tiêu chuẩn IAAF.',
    tag: 'Sức Bền Tim Mạch',
    area: 'Sân Vận Động Trọng Điểm',
    icon: 'directions_run',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 18,
    name: 'Chèo Thuyền Kayak & SUP',
    slug: 'kayak-sup',
    category: 'water',
    categoryName: 'Dưới Nước',
    subtitle: 'Trải nghiệm thể thao dưới nước',
    description: 'Hồ sinh thái nội khu rộng 2 ha với đầy đủ áo phao, thuyền Kayak đôi và ván SUP cứu hộ túc trực.',
    tag: 'Thư Giãn Outdoor',
    area: 'Hồ Sinh Thái Nội Khu',
    icon: 'rowing',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 19,
    name: 'Bida Pool & Snooker Pro',
    slug: 'bida',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Bàn Aileex & Bóng Aramith',
    description: 'Không gian giải trí cao cấp 12 bàn Bida lỗ và Bida phăng chuẩn thi đấu, phục vụ giao lưu học viên.',
    tag: 'Giải Trí Đỉnh Cao',
    area: 'Tầng B1 - Lounge',
    icon: 'sports_bar',
    image: 'https://image.sggp.org.vn/Uploaded/2026/zdjwpcadl/2020_04_01/91174588_2246149255681358_2066982951417020416_n_RBBD.jpg.webp',
  },
  {
    sportId: 20,
    name: 'Cờ Vua & Mind Sports',
    slug: 'co-vua',
    category: 'mindbody',
    categoryName: 'Yoga & Pilates',
    subtitle: 'Thể thao trí tuệ & Chiến thuật',
    description: 'Phòng tập không gian yên tĩnh trang bị đồng hồ đếm giờ DGT chuẩn FIDE cho các kỳ thủ.',
    tag: 'Tư Duy Chiến Lược',
    area: 'Tầng 3 - Library Sports',
    icon: 'extension',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 21,
    name: 'Zumba & Dance Fitness',
    slug: 'zumba',
    category: 'mindbody',
    categoryName: 'Yoga & Pilates',
    subtitle: 'Vũ điệu âm nhạc năng lượng',
    description: 'Lớp nhảy La-tinh sôi động giúp xả stress, cải thiện vóc dáng và giải phóng năng lượng tuyệt vời.',
    tag: 'Năng Lượng Tích Cực',
    area: 'Studio Dance Tầng 2',
    icon: 'music_note',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 22,
    name: 'Thủy Liệu Pháp Hydrotherapy',
    slug: 'thuy-lieu',
    category: 'water',
    categoryName: 'Dưới Nước',
    subtitle: 'Bể sục Jacuzzi nóng lạnh',
    description: 'Hệ thống vòi phun nước áp lực cao giúp massage thư giãn toàn thân, tăng cường lưu thông máu.',
    tag: 'Phục Hồi Tối Đa',
    area: 'Aqua Recovery Zone',
    icon: 'hot_tub',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 23,
    name: 'CrossFit Vòng Sức Mạnh',
    slug: 'crossfit',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Thử thách sức bền & Lực bộc phát',
    description: 'Dụng cụ lốp xe kéo, xà đơn liên hoàn, tạ ấm Kettlebell giúp đốt phá giới hạn thể chất.',
    tag: 'Siêu Cường Độ',
    area: 'Outdoor Crossfit Park',
    icon: 'fitness_center',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 24,
    name: 'Nhảy Xà & Nhảy Xa',
    slug: 'nhay-xa',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Hố cát tiêu chuẩn điền kinh',
    description: 'Hố cát xốp mịn chống xước xát kết hợp xà nhảy cao điều chỉnh được độ cao chính xác.',
    tag: 'Bộc Phát Sức Mạnh',
    area: 'Sân Vận Động Trọng Điểm',
    icon: 'sprint',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 25,
    name: 'Bắn Súng Sơn Paintball',
    slug: 'sung-son',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Đồng đội & Chiến thuật sinh tồn',
    description: 'Trận địa chướng ngại vật sinh động rộng 1.000m² trang bị súng hơi và giáp bảo hộ đầy đủ.',
    tag: 'Gắn Kết Đồng Đội',
    area: 'Khu Dã Ngoại Outdoor',
    icon: 'track_changes',
    image: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 26,
    name: 'Bơi Nghệ Thuật & Bơi Ngửa',
    slug: 'boi-nghe-thuat',
    category: 'water',
    categoryName: 'Dưới Nước',
    subtitle: 'Kỹ thuật di chuyển dưới nước',
    description: 'Huấn luyện viên kèm cặp kỹ năng nổi nước, kiểm soát nhịp thở và tư thế bơi chuẩn xác.',
    tag: 'Dẻo Dai Dưới Nước',
    area: 'Bể Bơi Bốn Mùa',
    icon: 'water',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 27,
    name: 'Inline Skate & Trượt Patin',
    slug: 'patin',
    category: 'other',
    categoryName: 'Khác & Giả Lập',
    subtitle: 'Sân trượt mịn láng chấn động',
    description: 'Sân trượt chất liệu Epoxy phẳng mịn trang bị nón bảo vệ, bọc gối tay chân cho học viên mới tập.',
    tag: 'Khéo Léo Linh Hoạt',
    area: 'Sân Trượt Mới',
    icon: 'ice_skating',
    image: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 28,
    name: 'Sasuke Obstacle Course',
    slug: 'sasuke',
    category: 'fitness',
    categoryName: 'Gym & Fitness',
    subtitle: 'Chuỗi chướng ngại vật thể lực',
    description: 'Thử thách leo đu xà, vượt tường cong 4m và cầu thăng bằng rèn luyện ý chí kiên cường.',
    tag: 'Chinh Phục Giới Hạn',
    area: 'Outdoor Adventure Zone',
    icon: 'sports_score',
    image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 29,
    name: 'Cardio Kickboxing',
    slug: 'kickboxing',
    category: 'combat',
    categoryName: 'Võ Thuật',
    subtitle: 'Đòn đấm đá giải phóng Calo',
    description: 'Sự kết hợp giữa Boxing và đòn đá Muay Thai trên nền nhạc sôi động giúp giảm cân thần tốc.',
    tag: 'Săn Chắc Cơ Thể',
    area: 'Khu Đấu Đài Combat',
    icon: 'sports_mma',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
  },
  {
    sportId: 30,
    name: 'Aerobic Thể Dục Nhịp Điệu',
    slug: 'aerobic',
    category: 'mindbody',
    categoryName: 'Yoga & Pilates',
    subtitle: 'Bền bỉ & Tim mạch khỏe mạnh',
    description: 'Lớp tập nhóm vui vẻ với bài tập nhịp điệu liên tục cải thiện dung tích phổi và hệ tuần hoàn.',
    tag: 'Khỏe Đẹp Mỗi Ngày',
    area: 'Studio Aerobic Tầng 1',
    icon: 'fitness_center',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
  },
];

export default function PublicContentPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Tất Cả 30 Môn' },
    { id: 'racket', label: 'Môn Vợt & Bóng' },
    { id: 'water', label: 'Dưới Nước' },
    { id: 'fitness', label: 'Gym & Fitness' },
    { id: 'mindbody', label: 'Yoga & Pilates' },
    { id: 'combat', label: 'Võ Thuật' },
    { id: 'other', label: 'Khác & Giả Lập' },
  ];

  const filteredSports = FULL_30_SPORTS.filter((sport) => {
    const matchesCategory = selectedCategory === 'all' || sport.category === selectedCategory;
    const matchesSearch =
      sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sport.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sport.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold text-slate-500 hover:text-orange-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Trang chủ</span>
            </Link>
          </div>

          {/* Header Title & Description */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-[11px] font-extrabold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>HỆ THỐNG 30+ BỘ MÔN CHUẨN OLYMPIC</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-tight">
              Khám Phá Các Bộ Môn Thể Thao
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl font-medium">
              Trải nghiệm hơn 30+ bộ môn vận động từ cơ bản đến thi đấu chuyên nghiệp với cơ sở vật chất chuẩn quốc tế và sự hướng dẫn của HLV giàu kinh nghiệm.
            </p>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold shrink-0 transition-all cursor-pointer ${selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bộ môn (Pickleball, Gym, Bơi...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Sports Cards Grid */}
          {filteredSports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 my-8">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                search_off
              </span>
              <p className="text-sm text-slate-600 font-bold mb-1">
                Không tìm thấy bộ môn phù hợp
              </p>
              <p className="text-xs text-slate-400">
                Vui lòng thử lại với từ khóa tìm kiếm khác hoặc chọn mục Tất cả bộ môn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSports.map((sport) => (
                <article
                  key={sport.sportId}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Sport Image */}
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-100 relative">
                      <img
                        src={sport.image}
                        alt={sport.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] uppercase font-extrabold tracking-wider">
                        {sport.tag}
                      </span>
                    </div>

                    {/* Icon & Title Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">
                          {sport.icon}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                          {sport.name}
                        </h2>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                          {sport.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600 font-medium mb-4 mt-2">
                      {sport.description}
                    </p>
                  </div>

                  {/* Bottom Strip */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {sport.area}
                    </span>
                    <Link
                      to="/pricing"
                      state={{ sportName: sport.name }}
                      className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-orange-600 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Đăng ký tập</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}