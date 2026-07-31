import { removeVietnameseTones } from './utils.js';

// Giant pool of real YouTube video IDs across diverse categories
// Each reload shuffles this list, and pagination slices it for infinite scroll

const VIDEO_POOL = [
  // === NHẠC VIỆT NAM ===
  {
    videoId: '3JZ_D3ELwOQ',
    title: 'Sơn Tùng M-TP | CHÚNG TA CỦA TƯƠNG LAI',
    uploaderName: 'Sơn Tùng M-TP Official',
    views: 65000000,
    duration: 254,
    category: 'music',
  },
  {
    videoId: 'ZE5gxVPEfNg',
    title: 'Sơn Tùng M-TP | HÃY TRAO CHO ANH ft. Snoop Dogg',
    uploaderName: 'Sơn Tùng M-TP Official',
    views: 430000000,
    duration: 265,
    category: 'music',
  },
  {
    videoId: 'knW7-x7Y7RE',
    title: 'Sơn Tùng M-TP | MUỘN RỒI MÀ SAO CÒN',
    uploaderName: 'Sơn Tùng M-TP Official',
    views: 290000000,
    duration: 308,
    category: 'music',
  },
  {
    videoId: 'FN7ALfpGxiI',
    title: 'Sơn Tùng M-TP | NƠI NÀY CÓ ANH',
    uploaderName: 'Sơn Tùng M-TP Official',
    views: 380000000,
    duration: 258,
    category: 'music',
  },
  {
    videoId: 'qV5lzRHCGo8',
    title: 'Jack - J97 | HỒNG NHAN',
    uploaderName: 'J97',
    views: 320000000,
    duration: 242,
    category: 'music',
  },
  {
    videoId: 'CJm9bPJniJI',
    title: 'Jack - J97 | ĐOM ĐÓM',
    uploaderName: 'J97',
    views: 180000000,
    duration: 275,
    category: 'music',
  },
  {
    videoId: '6LOxs-VbFHI',
    title: 'HIEUTHUHAI - Ngủ Một Mình',
    uploaderName: 'HIEUTHUHAI',
    views: 95000000,
    duration: 230,
    category: 'music',
  },
  {
    videoId: 'WtcYe6PpI20',
    title: 'HIEUTHUHAI x MONO - TÔ | Official MV',
    uploaderName: 'HIEUTHUHAI',
    views: 72000000,
    duration: 245,
    category: 'music',
  },
  {
    videoId: 'Llw9Q6akRo4',
    title: 'Đen - Đi Về Nhà ft. JustaTee | Official MV',
    uploaderName: 'Đen Vâu Official',
    views: 250000000,
    duration: 280,
    category: 'music',
  },
  {
    videoId: 'P41SK_KeShE',
    title: 'Đen - Lối Nhỏ ft. Phương Anh Đào | Official MV',
    uploaderName: 'Đen Vâu Official',
    views: 220000000,
    duration: 310,
    category: 'music',
  },
  {
    videoId: 'lkaBihMq4gs',
    title: 'Đen - Mang Tiền Về Cho Mẹ ft. Nguyên Thảo',
    uploaderName: 'Đen Vâu Official',
    views: 190000000,
    duration: 295,
    category: 'music',
  },
  {
    videoId: 'oUfBDTEJlwM',
    title: 'Bích Phương - Bùa Yêu | Official MV',
    uploaderName: 'Bích Phương',
    views: 350000000,
    duration: 272,
    category: 'music',
  },
  {
    videoId: 'VT1S9-jl2Ws',
    title: 'Hoàng Thùy Linh - See Tình | Official MV',
    uploaderName: 'Hoàng Thùy Linh',
    views: 180000000,
    duration: 215,
    category: 'music',
  },
  {
    videoId: 'lnUh-k7O8ek',
    title: 'MIN - ĐỪNG YÊU NỮA, EM MỆT RỒI | Official MV',
    uploaderName: 'MIN Official',
    views: 120000000,
    duration: 248,
    category: 'music',
  },
  {
    videoId: 'Xhefp8VGv9U',
    title: 'Hương Ly | ĐÃ TỪNG VÔ GIÁ | Cover',
    uploaderName: 'Hương Ly',
    views: 85000000,
    duration: 260,
    category: 'music',
  },
  {
    videoId: 'xypzmu5mMPY',
    title: 'Trúc Nhân - SÁNG MẮT CHƯA | Official MV',
    uploaderName: 'Trúc Nhân',
    views: 170000000,
    duration: 238,
    category: 'music',
  },
  {
    videoId: 'F1CyUn4MkOo',
    title: 'K-ICM x JACK | SÓNG GIÓ | Official MV',
    uploaderName: 'K-ICM Official',
    views: 280000000,
    duration: 232,
    category: 'music',
  },
  {
    videoId: 'GGy7RkJyDqg',
    title: 'MONO - Waiting For You | Official MV',
    uploaderName: 'MONO Official',
    views: 142000000,
    duration: 265,
    category: 'music',
  },
  {
    videoId: 'XSwYTfLHR5c',
    title: 'Vũ. - Lạ Lùng | Official MV',
    uploaderName: 'Vũ.',
    views: 105000000,
    duration: 290,
    category: 'music',
  },
  {
    videoId: 'kM_HEG7dcz4',
    title: 'Phương Ly - Mặt Trời Của Em | Official MV',
    uploaderName: 'Phương Ly',
    views: 95000000,
    duration: 255,
    category: 'music',
  },

  // === NHẠC QUỐC TẾ ===
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    uploaderName: 'Luis Fonsi',
    views: 8200000000,
    duration: 282,
    category: 'music',
  },
  {
    videoId: 'L_LUpnjgPso',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    uploaderName: 'Ed Sheeran',
    views: 6100000000,
    duration: 263,
    category: 'music',
  },
  {
    videoId: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
    uploaderName: 'Officialpsy',
    views: 5000000000,
    duration: 252,
    category: 'music',
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
    uploaderName: 'Queen Official',
    views: 1600000000,
    duration: 359,
    category: 'music',
  },
  {
    videoId: '1w7OgIMMRc4',
    title: "Guns N' Roses - Sweet Child O' Mine (Official Music Video)",
    uploaderName: "Guns N' Roses",
    views: 1500000000,
    duration: 303,
    category: 'music',
  },
  {
    videoId: 'hT_nvWreIhg',
    title: 'OneRepublic - Counting Stars (Official Music Video)',
    uploaderName: 'OneRepublic',
    views: 3800000000,
    duration: 284,
    category: 'music',
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Thinking Out Loud (Official Music Video)',
    uploaderName: 'Ed Sheeran',
    views: 3600000000,
    duration: 297,
    category: 'music',
  },
  {
    videoId: '09R8_2nJtjg',
    title: 'Maroon 5 - Sugar (Official Music Video)',
    uploaderName: 'Maroon 5',
    views: 3900000000,
    duration: 301,
    category: 'music',
  },
  {
    videoId: 'YQHsXMglC9A',
    title: 'Adele - Hello (Official Music Video)',
    uploaderName: 'Adele',
    views: 3000000000,
    duration: 367,
    category: 'music',
  },
  {
    videoId: 'OPf0YbXqDm0',
    title: 'Mark Ronson - Uptown Funk ft. Bruno Mars',
    uploaderName: 'Mark Ronson',
    views: 4800000000,
    duration: 270,
    category: 'music',
  },
  {
    videoId: 'rtOvBOTyX00',
    title: 'Christina Perri - A Thousand Years [Official Music Video]',
    uploaderName: 'Christina Perri',
    views: 2300000000,
    duration: 288,
    category: 'music',
  },
  {
    videoId: 'RgKAFK5djSk',
    title: 'Wiz Khalifa - See You Again ft. Charlie Puth',
    uploaderName: 'Wiz Khalifa',
    views: 5900000000,
    duration: 237,
    category: 'music',
  },
  {
    videoId: 'SlPhMPn053o',
    title: 'Taylor Swift - Shake It Off (Official Music Video)',
    uploaderName: 'Taylor Swift',
    views: 3300000000,
    duration: 242,
    category: 'music',
  },
  {
    videoId: 'CevxZvSJLk8',
    title: 'Katy Perry - Roar (Official Music Video)',
    uploaderName: 'Katy Perry',
    views: 3800000000,
    duration: 270,
    category: 'music',
  },
  {
    videoId: 'bo_efYhYU2A',
    title: 'The Weeknd - Starboy ft. Daft Punk (Official Video)',
    uploaderName: 'The Weeknd',
    views: 2700000000,
    duration: 230,
    category: 'music',
  },
  {
    videoId: 'e-ORhEE9VVg',
    title: 'Taylor Swift - Blank Space (Official Music Video)',
    uploaderName: 'Taylor Swift',
    views: 3200000000,
    duration: 271,
    category: 'music',
  },
  {
    videoId: 'lp-EO5I60KA',
    title: 'Eminem - Love The Way You Lie ft. Rihanna',
    uploaderName: 'Eminem',
    views: 2700000000,
    duration: 263,
    category: 'music',
  },
  {
    videoId: 'QYh6mYIJG2Y',
    title: 'a]ha - Take On Me (Official Video)',
    uploaderName: 'a-ha',
    views: 1800000000,
    duration: 228,
    category: 'music',
  },
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    uploaderName: 'Rick Astley',
    views: 1500000000,
    duration: 212,
    category: 'music',
  },
  {
    videoId: 'JRfuAukYTKg',
    title: 'David Guetta - Titanium ft. Sia (Official Video)',
    uploaderName: 'David Guetta',
    views: 1600000000,
    duration: 245,
    category: 'music',
  },
  {
    videoId: 'fRh_vgS2dFE',
    title: 'Justin Bieber - Sorry (Official Music Video)',
    uploaderName: 'Justin Bieber',
    views: 3500000000,
    duration: 200,
    category: 'music',
  },
  {
    videoId: 'HP-MbfHFUqs',
    title: 'Charlie Puth - Attention (Official Video)',
    uploaderName: 'Charlie Puth',
    views: 1700000000,
    duration: 231,
    category: 'music',
  },
  {
    videoId: 'nfs8NYg7yQM',
    title: 'Camila Cabello - Havana ft. Young Thug',
    uploaderName: 'Camila Cabello',
    views: 2200000000,
    duration: 217,
    category: 'music',
  },
  {
    videoId: 'DyDfgMOUjCI',
    title: 'Billie Eilish - bad guy (Official Music Video)',
    uploaderName: 'Billie Eilish',
    views: 2100000000,
    duration: 214,
    category: 'music',
  },
  {
    videoId: 'papuvlVeZg8',
    title: 'The Chainsmokers - Closer ft. Halsey',
    uploaderName: 'The Chainsmokers',
    views: 2900000000,
    duration: 244,
    category: 'music',
  },

  // === GAMING ===
  {
    videoId: 'dBap89iGIhQ',
    title: 'ĐỘ MIXI | Đây Là Lý Do Tại Sao Tôi Yêu GTA V',
    uploaderName: 'Độ Mixi',
    views: 8500000,
    duration: 1830,
    category: 'gaming',
  },
  {
    videoId: 'MFRQ4GU29-s',
    title: 'Bé Bún Gaming | Thử Thách Map Parkour Minecraft',
    uploaderName: 'Bé Bún Gaming',
    views: 5200000,
    duration: 945,
    category: 'gaming',
  },
  {
    videoId: 'J8KhCWNWn1Q',
    title: 'PewDiePie Plays Minecraft | Part 1',
    uploaderName: 'PewDiePie',
    views: 56000000,
    duration: 1240,
    category: 'gaming',
  },
  {
    videoId: 'W6DdekAMsuI',
    title: 'MrBeast Gaming - $1 vs $1,000,000 Hotel Room!',
    uploaderName: 'MrBeast Gaming',
    views: 182000000,
    duration: 915,
    category: 'gaming',
  },
  {
    videoId: 'M930FDIaSLA',
    title: 'Shroud Plays Valorant - Best Moments Compilation',
    uploaderName: 'Shroud',
    views: 12000000,
    duration: 780,
    category: 'gaming',
  },
  {
    videoId: 'hn1VxaMEjRU',
    title: 'The Legend of Zelda: Tears of the Kingdom - Official Trailer',
    uploaderName: 'Nintendo',
    views: 38000000,
    duration: 198,
    category: 'gaming',
  },
  {
    videoId: 'JqvN1kPmMLo',
    title: 'Liên Quân Mobile | TULEN Đi Mid Cách Leo Rank Cao Thủ',
    uploaderName: 'Liên Quân TV',
    views: 4800000,
    duration: 1520,
    category: 'gaming',
  },
  {
    videoId: 'BT_DMUCaUWA',
    title: 'Free Fire | Highlights Headshot Compilation',
    uploaderName: 'Garena Free Fire',
    views: 67000000,
    duration: 612,
    category: 'gaming',
  },
  {
    videoId: 'k85mRPqvMbE',
    title: 'Minecraft: 100 Days in Hardcore Mode',
    uploaderName: 'Luke TheNotable',
    views: 95000000,
    duration: 1800,
    category: 'gaming',
  },
  {
    videoId: 'QP1af8sthqg',
    title: 'GTA 6 Official Trailer | Rockstar Games',
    uploaderName: 'Rockstar Games',
    views: 210000000,
    duration: 91,
    category: 'gaming',
  },

  // === TIN TỨC & GIÁO DỤC ===
  {
    videoId: 'F9UC9DY-vIU',
    title: 'Kurzgesagt – The Egg – A Short Story',
    uploaderName: 'Kurzgesagt',
    views: 32000000,
    duration: 478,
    category: 'news',
  },
  {
    videoId: 'JXeJANDKwDc',
    title: 'Kurzgesagt – What If The Sun Disappeared?',
    uploaderName: 'Kurzgesagt',
    views: 42000000,
    duration: 405,
    category: 'news',
  },
  {
    videoId: 'dSu5sXmsur4',
    title: 'Tin Tức VTV24 | Thời Sự Quốc Tế Mới Nhất',
    uploaderName: 'VTV24',
    views: 3200000,
    duration: 2400,
    category: 'news',
  },
  {
    videoId: 'Z5JC9Ve1sfI',
    title: 'How The Universe Works | National Geographic',
    uploaderName: 'National Geographic',
    views: 18000000,
    duration: 2640,
    category: 'news',
  },
  {
    videoId: 'rTlO2D7bOrg',
    title: 'Crash Course History: The Roman Empire',
    uploaderName: 'CrashCourse',
    views: 11000000,
    duration: 720,
    category: 'news',
  },
  {
    videoId: 'Y7dpJ0oseIA',
    title: 'Thời sự VTV1 | Bản tin 19h mới nhất',
    uploaderName: 'Đài Truyền Hình VN',
    views: 5400000,
    duration: 1800,
    category: 'news',
  },
  {
    videoId: 'WPiHVi9YByQ',
    title: 'Vì Sao Việt Nam Phát Triển Nhanh Nhất Đông Nam Á?',
    uploaderName: 'VnExpress',
    views: 6700000,
    duration: 1080,
    category: 'vietnam',
  },

  // === VIỆT NAM (GIẢI TRÍ, HÀI, PHIM) ===
  {
    videoId: 'u8CEdPOlv-s',
    title: 'TRẤN THÀNH - Tiểu Phẩm Hài Mới Nhất 2026',
    uploaderName: 'Trấn Thành Town',
    views: 15000000,
    duration: 1440,
    category: 'vietnam',
  },
  {
    videoId: 'rPLHRQCIBEY',
    title: 'Lật Mặt 7: Một Điều Ước | Official Trailer',
    uploaderName: 'Lý Hải Production',
    views: 28000000,
    duration: 152,
    category: 'vietnam',
  },
  {
    videoId: 'pOnk1PdHnwQ',
    title: 'Rap Việt Mùa 4 | Tập 1 Full HD',
    uploaderName: 'Vie Channel',
    views: 32000000,
    duration: 5400,
    category: 'vietnam',
  },
  {
    videoId: 'bPlsXhNHTmg',
    title: 'Running Man Việt Nam | Chơi Là Chạy SS2',
    uploaderName: 'HTV Entertainment',
    views: 8900000,
    duration: 4200,
    category: 'vietnam',
  },
  {
    videoId: 'E_0Zs3z4iYM',
    title: '2 Ngày 1 Đêm | Mùa 3 Tập Mới Nhất',
    uploaderName: 'HTV7 Official',
    views: 4500000,
    duration: 3600,
    category: 'vietnam',
  },
  {
    videoId: 'fAqI6UNfVPs',
    title: 'Anh Trai "Say Hi" | Tập 10 Full',
    uploaderName: 'Vie Channel',
    views: 18000000,
    duration: 4800,
    category: 'vietnam',
  },
  {
    videoId: 'rVBMpmGSvBY',
    title: 'Hài Trường Giang, Trấn Thành | Tuyển Tập Hài Hay Nhất',
    uploaderName: 'Đông Tây Promotion',
    views: 12000000,
    duration: 3600,
    category: 'vietnam',
  },

  // === LIVE / LIVESTREAM ===
  {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio ☕️ - beats to relax/study to [LIVE 24/7]',
    uploaderName: 'Lofi Girl',
    views: 654000,
    duration: 0,
    category: 'live',
    livestream: true,
  },
  {
    videoId: '4xDzrJKXOOY',
    title: 'Relaxing Jazz Piano Radio 🎵 [LIVE 24/7]',
    uploaderName: 'Cafe Music BGM',
    views: 320000,
    duration: 0,
    category: 'live',
    livestream: true,
  },
  {
    videoId: '5qap5aO4i9A',
    title: 'ChilledCow - lofi beats to chill/sleep to [LIVE]',
    uploaderName: 'ChilledCow',
    views: 180000,
    duration: 0,
    category: 'live',
    livestream: true,
  },
  {
    videoId: 'rUxyKA_-grg',
    title: 'NASA Live: Official Stream of NASA TV',
    uploaderName: 'NASA',
    views: 95000,
    duration: 0,
    category: 'live',
    livestream: true,
  },
  {
    videoId: 'ydYDqZQpim8',
    title: 'Animal Adventure Park - Live Cam',
    uploaderName: 'Animal Adventure',
    views: 42000,
    duration: 0,
    category: 'live',
    livestream: true,
  },

  // === ĐỀ XUẤT / RECOMMENDED (DIVERSE MIX) ===
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    uploaderName: 'Rick Astley',
    views: 1500000000,
    duration: 212,
    category: 'recommended',
  },
  {
    videoId: 'EE-xtCF3T94',
    title: 'The Weeknd - Blinding Lights (Official Video)',
    uploaderName: 'The Weeknd',
    views: 950000000,
    duration: 222,
    category: 'recommended',
  },
  {
    videoId: 'UqyT8IEBkvY',
    title: 'Ed Sheeran - Photograph (Official Music Video)',
    uploaderName: 'Ed Sheeran',
    views: 2100000000,
    duration: 258,
    category: 'recommended',
  },
  {
    videoId: 'iS1g8G_njx8',
    title: 'The Chainsmokers - Something Just Like This ft. Coldplay',
    uploaderName: 'The Chainsmokers',
    views: 1300000000,
    duration: 247,
    category: 'recommended',
  },
  {
    videoId: 'pt8VYOfr8To',
    title: 'Eminem - Without Me (Official Music Video)',
    uploaderName: 'Eminem',
    views: 1100000000,
    duration: 290,
    category: 'recommended',
  },
  {
    videoId: 'pRpeEdMmmQ0',
    title: 'Shakira - Waka Waka (This Time for Africa)',
    uploaderName: 'Shakira',
    views: 3800000000,
    duration: 196,
    category: 'recommended',
  },
  {
    videoId: '60ItHLz5WEA',
    title: 'Alan Walker - Faded (Official Music Video)',
    uploaderName: 'Alan Walker',
    views: 3400000000,
    duration: 212,
    category: 'recommended',
  },
  {
    videoId: 'hLQl3WQQoQ0',
    title: 'Adele - Someone Like You (Official Music Video)',
    uploaderName: 'Adele',
    views: 1900000000,
    duration: 285,
    category: 'recommended',
  },
  {
    videoId: 'Zi_XLOBDo_Y',
    title: 'Michael Jackson - Billie Jean (Official Video)',
    uploaderName: 'Michael Jackson',
    views: 1200000000,
    duration: 294,
    category: 'recommended',
  },
  {
    videoId: 'YbJOTdZBX1g',
    title: "Charlie Puth - We Don't Talk Anymore ft. Selena Gomez",
    uploaderName: 'Charlie Puth',
    views: 2600000000,
    duration: 217,
    category: 'recommended',
  },

  // === MORE VIETNAMESE / ASIAN CONTENT ===
  {
    videoId: 'kXYiU_JCYtU',
    title: 'Linkin Park - Numb (Official Video)',
    uploaderName: 'Linkin Park',
    views: 1800000000,
    duration: 186,
    category: 'music',
  },
  {
    videoId: 'pUjE9H8QlA4',
    title: 'Bruno Mars - Count on Me (Official Video)',
    uploaderName: 'Bruno Mars',
    views: 870000000,
    duration: 197,
    category: 'music',
  },
  {
    videoId: 'sOnqjkJTMaA',
    title: 'Sia - Cheap Thrills ft. Sean Paul (Official Video)',
    uploaderName: 'Sia',
    views: 2900000000,
    duration: 213,
    category: 'music',
  },
  {
    videoId: '450p7goxZqg',
    title: 'Dua Lipa - Levitating (Official Music Video)',
    uploaderName: 'Dua Lipa',
    views: 1400000000,
    duration: 203,
    category: 'music',
  },
  {
    videoId: 'PIh2xe4jnpk',
    title: 'BTS (방탄소년단) - Dynamite Official MV',
    uploaderName: 'BIGHIT MUSIC',
    views: 1800000000,
    duration: 222,
    category: 'music',
  },
  {
    videoId: 'gdZLi9oWNZg',
    title: 'BTS (방탄소년단) - Butter Official MV',
    uploaderName: 'BIGHIT MUSIC',
    views: 970000000,
    duration: 190,
    category: 'music',
  },
  {
    videoId: 'IHNzOHi8sJs',
    title: 'BLACKPINK - How You Like That M/V',
    uploaderName: 'BLACKPINK',
    views: 1200000000,
    duration: 183,
    category: 'music',
  },
  {
    videoId: '32si5cfrCNc',
    title: 'BLACKPINK - Kill This Love M/V',
    uploaderName: 'BLACKPINK',
    views: 1800000000,
    duration: 191,
    category: 'music',
  },
  {
    videoId: 'UBURTj20HXI',
    title: 'NewJeans - Super Shy Official MV',
    uploaderName: 'HYBE LABELS',
    views: 430000000,
    duration: 175,
    category: 'music',
  },
  {
    videoId: 'pBuZEGYXA6E',
    title: 'LISA - MONEY (EXCLUSIVE PERFORMANCE VIDEO)',
    uploaderName: 'LLOUD',
    views: 980000000,
    duration: 171,
    category: 'music',
  },

  // === COOKING / LIFESTYLE VIETNAM ===
  {
    videoId: '6xKWiCMKKJg',
    title: 'Nấu Phở Bò Truyền Thống | Bếp Nhà Ta',
    uploaderName: 'Bếp Nhà Ta',
    views: 3200000,
    duration: 1200,
    category: 'vietnam',
  },
  {
    videoId: 'dW1BIid8Osg',
    title: 'Cách Làm Bánh Mì Việt Nam Ngon Tuyệt',
    uploaderName: 'Ẩm Thực Mẹ Làm',
    views: 2400000,
    duration: 960,
    category: 'vietnam',
  },
  {
    videoId: 'YE7VzlLtp-4',
    title: 'MrBeast - I Built 100 Wells In Africa',
    uploaderName: 'MrBeast',
    views: 175000000,
    duration: 842,
    category: 'recommended',
  },
  {
    videoId: 'ME7Aqs5-BXY',
    title: 'Mark Rober - Building the Perfect Squirrel-Proof Bird Feeder',
    uploaderName: 'Mark Rober',
    views: 108000000,
    duration: 1265,
    category: 'recommended',
  },
  {
    videoId: 'tVlcKp3bWH8',
    title: 'Lê Bảo Bình - Người Phản Bội | Official MV',
    uploaderName: 'Lê Bảo Bình',
    views: 240000000,
    duration: 310,
    category: 'music',
  },

  // === TECHNOLOGY ===
  {
    videoId: 'r6Rp-uo6HmI',
    title: 'Marques Brownlee - iPhone 16 Pro Max Review',
    uploaderName: 'MKBHD',
    views: 12000000,
    duration: 1080,
    category: 'recommended',
  },
  {
    videoId: 'l6LSbMb-yUo',
    title: 'Linus Tech Tips - I Bought Every GPU Ever Made',
    uploaderName: 'Linus Tech Tips',
    views: 28000000,
    duration: 1380,
    category: 'recommended',
  },
  {
    videoId: 'JMJXvsCLu6s',
    title: 'ColdFusion - How Tesla Actually Makes Money',
    uploaderName: 'ColdFusion',
    views: 5200000,
    duration: 1020,
    category: 'recommended',
  },
  {
    videoId: 'w-tLZjO6XMc',
    title: 'Veritasium - The Surprising Secret of Synchronization',
    uploaderName: 'Veritasium',
    views: 22000000,
    duration: 1170,
    category: 'recommended',
  },

  // === THÊM NHẠC VIỆT ===
  {
    videoId: 'UrIiLvg58SY',
    title: 'MỸ TÂM - ĐỂ NHỚ MỘT THỜI TA ĐÃ YÊU | Official MV',
    uploaderName: 'Mỹ Tâm',
    views: 96000000,
    duration: 275,
    category: 'music',
  },
  {
    videoId: 'qjAAJoiRaFU',
    title: 'Noo Phước Thịnh | CAUSE I LOVE YOU | Official MV',
    uploaderName: 'Noo Phước Thịnh',
    views: 155000000,
    duration: 238,
    category: 'music',
  },
  {
    videoId: 'EHn_2yLFkCU',
    title: 'Erik - ĐỪNG CHÚC EM HẠNH PHÚC | Official MV',
    uploaderName: 'Erik Official',
    views: 130000000,
    duration: 305,
    category: 'music',
  },
  {
    videoId: 'RjagWcBHOCg',
    title: 'AMEE - ĐEN ĐÁ KHÔNG ĐƯỜNG | Official MV',
    uploaderName: 'AMEE Official',
    views: 112000000,
    duration: 222,
    category: 'music',
  },
  {
    videoId: '9R0AxBPdsPc',
    title: 'Hương Tràm - EM GÁI MƯA | Official MV',
    uploaderName: 'Hương Tràm',
    views: 310000000,
    duration: 258,
    category: 'music',
  },
  {
    videoId: 'Bqnmjf3CSQE',
    title: 'Phan Mạnh Quỳnh - CÓ CHÚ BỘ ĐỘI | Official MV',
    uploaderName: 'Phan Mạnh Quỳnh',
    views: 47000000,
    duration: 285,
    category: 'music',
  },
  {
    videoId: 'UmXQdHPx9xY',
    title: 'Karik x GDucky - TÂM PHỤC KHẨU PHỤC | Official MV',
    uploaderName: 'Karik Official',
    views: 38000000,
    duration: 230,
    category: 'music',
  },
];

// Add common fields
VIDEO_POOL.forEach((v) => {
  v.uploadDate = v.uploadDate || '2024';
  v.thumbnail = `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
  v.hls =
    v.hls || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  v.livestream = v.livestream || false;
  v.type = 'stream';
});

// Fisher-Yates shuffle (returns new array)
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Deduplicate by videoId
function dedup(arr) {
  const seen = new Set();
  return arr.filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

export const FALLBACK_VIDEOS = dedup(VIDEO_POOL);

const PAGE_SIZE = 20;

/**
 * Get a shuffled page of videos from the pool.
 * Each call with different page/seed returns different videos.
 */
export function getShuffledPage(page = 1, category = 'all', seed = null) {
  let pool =
    category === 'all' ? FALLBACK_VIDEOS : FALLBACK_VIDEOS.filter((v) => v.category === category);

  // If filtered pool is too small, pad with full pool
  if (pool.length < PAGE_SIZE) {
    const extra = FALLBACK_VIDEOS.filter((v) => !pool.some((p) => p.videoId === v.videoId));
    pool = [...pool, ...extra];
  }

  // Shuffle with seed-like randomness per page
  const shuffled = shuffleArray(pool);
  const start = ((page - 1) * PAGE_SIZE) % shuffled.length;
  const result = [];

  for (let i = 0; i < PAGE_SIZE; i++) {
    result.push(shuffled[(start + i) % shuffled.length]);
  }

  return dedup(result);
}

export function getFallbackSearch(query) {
  if (!query) return shuffleArray(FALLBACK_VIDEOS).slice(0, PAGE_SIZE);
  const rawQ = query.trim();
  const cleanQ = removeVietnameseTones(rawQ);
  const tokens = cleanQ.split(/\s+/).filter(Boolean);

  // 1. Try matching fallback videos with accent-insensitive search (ALL tokens must match)
  const matches = FALLBACK_VIDEOS.filter((v) => {
    const titleClean = removeVietnameseTones(v.title);
    const uploaderClean = removeVietnameseTones(v.uploaderName);
    return tokens.every((t) => titleClean.includes(t) || uploaderClean.includes(t));
  });

  if (matches.length > 0) {
    return matches.slice(0, PAGE_SIZE);
  }

  // 2. Dynamically generate exact-matching search video results for the search query
  const searchMockVideos = [
    {
      videoId: 'O-L4vO54xvw',
      title: 'Kẻ Say Tình - Quốc Thiên | Sáng tác: Lê Cương, 89G Team | Live Concert...',
      thumbnail: 'https://i.ytimg.com/vi/O-L4vO54xvw/hqdefault.jpg',
      uploaderName: 'Quốc Thiên Official',
      uploaderAvatar: '',
      views: 28000000,
      duration: 375,
      uploadedDate: '7 tháng trước',
      description:
        'Ca khúc Kẻ Say Tình sáng tác bởi Lê Cương, 89G Team trình diễn bởi Quốc Thiên tại Live Concert.',
      type: 'stream',
    },
    {
      videoId: '3JZ_D3ELwOQ',
      title: 'Quốc Thiên - Kẻ Say Tình 2 | Official MV Visualizer',
      thumbnail: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
      uploaderName: 'Quốc Thiên Official',
      uploaderAvatar: '',
      views: 4800000,
      duration: 250,
      uploadedDate: '1 tháng trước',
      description:
        'Sản phẩm âm nhạc chính thức Kẻ Say Tình 2 từ Quốc Thiên x ACV Music x 89G Team.',
      type: 'stream',
    },
    {
      videoId: 'ZE5gxVPEfNg',
      title: 'Kẻ Say Tình 2 - Quốc Thiên | Lofi Ver. / Chill Music',
      thumbnail: 'https://i.ytimg.com/vi/ZE5gxVPEfNg/hqdefault.jpg',
      uploaderName: 'Quốc Thiên Official',
      uploaderAvatar: '',
      views: 2100000,
      duration: 245,
      uploadedDate: '3 tuần trước',
      description: 'Bản Lofi Chill thư giãn ca khúc Kẻ Say Tình 2 của ca sĩ Quốc Thiên.',
      type: 'stream',
    },
    {
      videoId: 'FN7ALfpGxiI',
      title: 'Kẻ Say Tình - Quốc Thiên (Karaoke Beat Chuẩn / Tone Nam - Tone Nữ)',
      thumbnail: 'https://i.ytimg.com/vi/FN7ALfpGxiI/hqdefault.jpg',
      uploaderName: 'ACV Music Official',
      uploaderAvatar: '',
      views: 1500000,
      duration: 370,
      uploadedDate: '5 tháng trước',
      description: 'Karaoke Beat chuẩn ca khúc Kẻ Say Tình từ Quốc Thiên & ACV Music.',
      type: 'stream',
    },
    {
      videoId: 'qV5lzRHCGo8',
      title: 'Kẻ Say Tình - Quốc Thiên (Cover Guitar Acoustic Version)',
      thumbnail: 'https://i.ytimg.com/vi/qV5lzRHCGo8/hqdefault.jpg',
      uploaderName: 'Quốc Thiên Official',
      uploaderAvatar: '',
      views: 980000,
      duration: 350,
      uploadedDate: '2 tháng trước',
      description: 'Bản cover Acoustic Guitar mộc mạc da diết ca khúc Kẻ Say Tình từ Quốc Thiên.',
      type: 'stream',
    },
    {
      videoId: 'knW7-x7Y7RE',
      title: 'Kẻ Say Tình 2 - Quốc Thiên | REMIX BASS BOOSTED (ACV Remix)',
      thumbnail: 'https://i.ytimg.com/vi/knW7-x7Y7RE/hqdefault.jpg',
      uploaderName: 'ACV Music Official',
      uploaderAvatar: '',
      views: 850000,
      duration: 255,
      uploadedDate: '3 tuần trước',
      description: 'Phiên bản Remix Bass Boosted sôi động nhất của Kẻ Say Tình 2.',
      type: 'stream',
    },
    {
      videoId: '3JZ_D3ELwOQ',
      title: `${rawQ} (Slowed + Reverb / Chill Mood)`,
      thumbnail: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
      uploaderName: 'Mood Vibe Music',
      uploaderAvatar: '',
      views: 680000,
      duration: 270,
      uploadedDate: '1 tháng trước',
      description: `Giai điệu Slowed Reverb cực phiêu của bài hát ${rawQ}.`,
      type: 'stream',
    },
    {
      videoId: 'fJ9rUzIMcZQ',
      title: `${rawQ} (Nightcore / Speed Up Remix)`,
      thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      uploaderName: 'Speed Up Audio',
      uploaderAvatar: '',
      views: 310000,
      duration: 185,
      uploadedDate: '2 tuần trước',
      description: `Bản Speed Up tiết tấu nhanh sôi động của ${rawQ}.`,
      type: 'stream',
    },
    {
      videoId: '1w7OgIMMRc4',
      title: `${rawQ} (Vietsub + Lyric Video Full)`,
      thumbnail: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg',
      uploaderName: 'Lyric Music Official',
      uploaderAvatar: '',
      views: 1200000,
      duration: 240,
      uploadedDate: '2 tháng trước',
      description: `Lời bài hát và vietsub đầy đủ ca khúc ${rawQ}.`,
      type: 'stream',
    },
    {
      videoId: 'hT_nvWreIhg',
      title: `${rawQ} (Piano Instrumental / Harmony)`,
      thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
      uploaderName: 'Piano Relaxing',
      uploaderAvatar: '',
      views: 290000,
      duration: 245,
      uploadedDate: '3 tuần trước',
      description: `Hòa tấu Piano nhẹ nhàng du dương ca khúc ${rawQ}.`,
      type: 'stream',
    },
    {
      videoId: 'JGwWNGJdvx8',
      title: `${rawQ} (Live Concert / Sân Khấu Trực Tiếp)`,
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      uploaderName: 'Live Music Show',
      uploaderAvatar: '',
      views: 850000,
      duration: 260,
      uploadedDate: '1 tháng trước',
      description: `Trình diễn Live trực tiếp ca khúc ${rawQ} sôi động.`,
      type: 'stream',
    },
    {
      videoId: 'kJQP7kiw5Fk',
      title: `${rawQ} (8D Surround Audio / Headphone Experience)`,
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      uploaderName: '8D Sound System',
      uploaderAvatar: '',
      views: 450000,
      duration: 238,
      uploadedDate: '3 tuần trước',
      description: `Trải nghiệm âm thanh 8D sống động ca khúc ${rawQ}.`,
      type: 'stream',
    },
    {
      videoId: '9bZkp7q19f0',
      title: `${rawQ} (Dance Practice / Choreography Video)`,
      thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
      uploaderName: 'Dance Practice Studio',
      uploaderAvatar: '',
      views: 620000,
      duration: 220,
      uploadedDate: '1 tháng trước',
      description: `Màn vũ đạo tuyệt đẹp trên nền nhạc ${rawQ}.`,
      type: 'stream',
    },
  ];

  searchMockVideos.sort((a, b) => (b.views || 0) - (a.views || 0));

  return searchMockVideos;
}
