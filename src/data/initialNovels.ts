import { Novel } from '../types/novel';

export const ALL_GENRES: string[] = [
  'All', 'Fantasy', 'Romance', 'Action', 'Adventure', 
  'Drama', 'Mystery', 'Sci-Fi', 'Martial Arts', 'Slice of Life', 'System'
];

export const INITIAL_NOVELS: Novel[] = [
  {
    id: '1',
    slug: 'the-silent-moon',
    title: 'The Silent Moon',
    altTitles: ['寂静之月', 'Silent Moonlight Chronicles'],
    author: 'Cang Lan (沧澜)',
    translator: 'Aether_TL',
    status: 'Ongoing',
    originalLanguage: 'Chinese',
    genres: ['Fantasy', 'Martial Arts', 'Romance', 'Mystery'],
    rating: 4.9,
    views: 142500,
    bookmarksCount: 3820,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    synopsis: 'When the lunar silver falls upon the forgotten ruins of Tianyuan, a disgraced cultivator discovers an ancient manual that transcribes the voice of the stars. In a realm controlled by tyrannical immortal sects, he must walk through shadow and flame to uncover the truth behind the celestial fracture that occurred ten thousand years ago.',
    latestChapter: 128,
    translatorNotes: 'Notes: Translating directly from the author\'s revised raw chapters. Release schedule is 5 chapters per week!',
    chapters: [
      {
        id: 'c1',
        chapterNumber: 1,
        title: 'Chapter 1: The Shattered Lunar Peak',
        wordCount: 2150,
        releaseDate: '2026-01-10',
        content: `The wind atop Mount Qi carried the pungent stench of old blood and oxidized copper.

Lin Chen knelt on the frosted obsidian tiles, his spiritual veins throbbing like raw wounds embedded deep beneath his flesh. The inner sect elders stood in a semi-circle around him, their embroidered blue robes fluttering against the gales of the northern divide.

"Hand over the Astral Codex, Lin Chen," Elder Zhao commanded, his voice vibrating with suppressed spiritual force. "Your father was declared a traitor three moons ago. You have no right to hold the treasure of the Founder."

Lin Chen slowly lifted his gaze. Blood dripped from his cracked lips onto the pale snow below, sizzling as his remaining fire-attribute qi fought to keep his core alive.

"Traitor?" Lin Chen chuckled softly, the sound raspy and dry. "My father held the Northern Gate against the Void Horde alone while you and the rest of the Grand Council hid behind the protective barrier. Is that what you call treason?"

Elder Zhao's face darkened. He raised his golden fan, the runes along its ribbing beginning to glow with lethal brilliance.

"Stubborn till the end," Zhao sneered. "Strike him down and seize his ring!"`,
        originalContent: `齐山之巅的风吹着陈年血腥与氧化铜的刺鼻气味。

林晨跪在霜冻的黑曜石砖上，周身经脉犹如埋在肉下的生辣伤口般剧烈跳动。内门长老们在他周围环绕成半圆，绣着青云纹的长袍在北麓的狂风中猎猎作响。

“交出星辰秘典，林晨，”赵长老厉声喝道，声音中蕴含着威压极强的灵力。“你父亲三月前已被定为叛逆，你无权保管始祖留下的至宝！”

林晨缓缓抬头。鲜血顺着他干裂的唇角滴落落在白雪上，残存的火属性气血与冰雪碰撞发出微弱的嘶嘶声。

“叛逆？”林晨哑声低笑，声音干涩而冰冷。“家父独守北天门抵抗虚空邪族，而你与大长老们却躲在护宗大阵之后。这就是你所谓的叛逆？”

赵长老面色骤沉，合拢手中的金骨扇，扇骨上的符文泛起凌厉杀意。

“冥顽不灵，”赵长老冷哼道。“动手，搜身夺戒！”`
      },
      {
        id: 'c2',
        chapterNumber: 2,
        title: 'Chapter 2: The Whispering Ember',
        wordCount: 2310,
        releaseDate: '2026-01-12',
        content: `Before the golden fan could descend, a blinding beam of silver light sliced through the storm clouds above Mount Qi.

The heavens seemed to split open. A resonance, soundless yet earth-shattering, rattled the soul of every cultivator present. The pressure was so immense that Elder Zhao's lethal blow was frozen mid-air, his fan trembling as the runes sputtered out like wet candles.

"What is this?" Elder Zhao cried out, taking two rapid steps backward, his eyes wide with genuine panic.

Lin Chen felt a sudden warmth in his chest. The black pebble he had picked up from his father's ruined study—the one everyone assumed was a simple luck charm—was vibrating rapidly.

A voice, calm and ancient as the void, echoed in his mind:
'Child of the fallen flame... do you wish to reshape the heavens, or be consumed by their ashes?'

Lin Chen clenched his fists, feeling the shattered fragments of his qi core burning with newfound purpose. "I will burn the heavens down before I bow."`,
        originalContent: `就在金扇挥下的刹那，一道璀璨至极的银色月华撕裂了齐山顶空积聚的阴云。

天地仿佛被生生割裂。一种无声却震慑灵魂的共鸣在所有修者心头炸响。那股庞大至极的威压直接将赵长老的致命一击定格在半空，扇骨上的符文如熄灭的蜡烛般闪烁熄灭。

“这是何物？！”赵长老惊骇暴退两步，双目圆睁，眼中满是无法掩饰的恐慌。

林晨只觉胸口陡然生出一股炽热。他在父亲废墟书房中捡到的那枚黑色小石子——那个所有人以为只是普通饰物的玩物——此刻正剧烈震颤。

一道平静、古老如虚空般的声音在他脑海中悠然响起：
“落日余烬之子……你是想重塑诸天，还是化为灰烬？”

林晨紧握双拳，感受着破碎的气海被一股前所未有的狂暴力量充盈：“若要我屈服，我宁先焚尽这苍穹！”`
      }
    ]
  },
  {
    id: '2',
    slug: 'crimson-horizon',
    title: 'Crimson Horizon',
    altTitles: ['크림슨 호라이즌', 'Red Sky Domain'],
    author: 'Min-Woo Park',
    translator: 'K-Translate',
    status: 'Ongoing',
    originalLanguage: 'Korean',
    genres: ['Action', 'Adventure', 'Sci-Fi', 'System'],
    rating: 4.8,
    views: 98000,
    bookmarksCount: 2100,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    synopsis: 'When the Sky Gate opened over Seoul in 2031, monsters weren\'t the only things that poured through. A mysterious game-like system granted humanity Awakened Abilities, but Jin-Hyuk received the worst class imaginable: [Scavenger]. Ten years later, a catastrophic betrayal inside a S-Rank dungeon resets his timeline.',
    latestChapter: 85,
    chapters: [
      {
        id: 'ch1_ch',
        chapterNumber: 1,
        title: 'Chapter 1: The Returner\'s Regret',
        wordCount: 1980,
        releaseDate: '2026-02-01',
        content: `The crimson sky of the Dungeon Boss room was suffocating.

Jin-Hyuk spat out a mouthful of dark blood, staring at the Guild Master who held the glowing spear through his chest.

"Why, Sung-Min?" Jin-Hyuk muttered. "We cleared the raid..."

"Because you know too much about the Ancient Key, Jin-Hyuk," Sung-Min replied coldly, twisting the spear blade. "A Scavenger should have stayed picking up trash."

As vision turned pitch black, a holographic window flared:
[System Alert: Secret Quest 'The Final Spark' Completed.]
[Rewinding time to Year 2031...]`,
        originalContent: `붉게 물든 던전 보스룸의 하늘은 숨이 턱턱 막힐 지경이었다.

진혁은 검붉은 피를 토해내며, 자신의 가슴을 꿰뚫은 빛나는 창을 쥔 길드장을 노려보았다.

"왜냐, 성민아..." 진혁이 중얼거렸다. "우린 레이드를 클리어했잖아..."

"네가 고대의 열쇠에 대해 너무 많은 걸 알고 있으니까, 진혁아," 성민이 차갑게 답하며 창날을 비틀었다. "스캐빈저는 쓰레기나 주우며 살았어야지."

시야가 칠흑 같은 어둠으로 물드는 순간, 홀로그램 창이 붉게 타올랐다:
[시스템 알림: 히든 퀘스트 '최후의 불꽃' 완료.]
[시간을 2031년으로 회귀합니다...]`
      }
    ]
  },
  {
    id: '3',
    slug: 'when-winter-meets-spring',
    title: 'When Winter Meets Spring',
    altTitles: ['冬が春に出会うとき', 'Fuyuharu'],
    author: 'Hana Ichika',
    translator: 'SakuraReads',
    status: 'Completed',
    originalLanguage: 'Japanese',
    genres: ['Romance', 'Drama', 'Slice of Life'],
    rating: 4.95,
    views: 210000,
    bookmarksCount: 5400,
    coverUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
    synopsis: 'A heartwarming and poignant story of an introverted pianist living in snowy Hokkaido who receives a series of mysterious vintage letters left behind inside a secondhand piano by an anonymous writer from twenty years ago.',
    latestChapter: 45,
    chapters: [
      {
        id: 'ch1_ww',
        chapterNumber: 1,
        title: 'Chapter 1: The Dust on Key 88',
        wordCount: 1800,
        releaseDate: '2025-11-15',
        content: `Snow fell outside the small music shop in Otaru like quiet memories.

Ren opened the wooden top of the upright Yamaha piano built in 1984. Deep behind the lowest bass hammer, tucked between felt pad and wood frame, was a yellowed envelope sealed with faded green wax.`,
        originalContent: `小樽の小さな楽器店の外では、静かな思い出のように雪が舞っていた。

蓮は1984年製のアップライトピアノの木製天板を開けた。最も低い音のハンマーの奥深く、フェルトと木枠の間に、色あせた緑の封蝋で閉じられた黄色い封筒が挟まれていた。`
      }
    ]
  },
  {
    id: '4',
    slug: 'the-last-astronomer',
    title: 'The Last Astronomer',
    altTitles: ['最后的观星者', 'Starlight Vanguard'],
    author: 'Chen Xing',
    translator: 'CosmicTL',
    status: 'Ongoing',
    originalLanguage: 'Chinese',
    genres: ['Sci-Fi', 'Mystery', 'Adventure'],
    rating: 4.7,
    views: 64000,
    bookmarksCount: 1450,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    synopsis: 'In a galaxy where artificial intelligence has mapped every star system, one rogue scholar discovers a blind spot in the galactic observatory—a sector of space that is actively deleting itself from reality.',
    latestChapter: 62,
    chapters: [
      {
        id: 'ch1_la',
        chapterNumber: 1,
        title: 'Chapter 1: Void Coordinates',
        wordCount: 2400,
        releaseDate: '2026-02-10',
        content: `The star chart was missing 0.0004 percent of its luminaries. To a casual technician on Titan Station, it was a minor rounding error in the quantum subroutines. To Dr. Samuel Vance, it was a crime scene.`,
        originalContent: `星图上少了百分之零点零零零四的星体。对于泰坦星站的普通技术人员来说，这只是量子子程序中微不足道的舍入误差。但对于萨缪尔·梵斯博士而言，这是一个犯罪现场。`
      }
    ]
  }
];
