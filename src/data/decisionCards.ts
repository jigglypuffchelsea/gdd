import { DecisionCard } from '../engine/types';

export const decisionCards: DecisionCard[] = [
  {
    id: '001',
    name: '大客戶的好意',
    type: 'event',
    yearRange: [2, 4],
    description: '你的最大客戶——佔營收 35% 的那位——突然說：「我們想一次買斷全年的量，先出貨，季末再付款。」財務部算了一下，這筆帳款 $300 萬。',
    isPredictionTarget: true,
    options: [
      {
        id: '001-A',
        label: '接單，先出貨再收款',
        description: '搶下大單，但 $300 萬變成應收帳款，現金不會馬上進來。團隊壓力山大（心跳 -8）。',
        immediate: { ar: 300, heartbeat: -8 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 4,
          isRandom: false,
          description: '大客戶資金周轉困難，$300 萬帳款只收回 $40 萬',
          attribution: '大客戶的好意：帳款違約',
          effects: {
            success: { cash: -260, roots: -30, chainedFuse: {
              sourceOption: 'A-chain',
              detonateAt: 2,
              isRandom: false,
              description: '客戶違約消息傳開，信譽受損',
              attribution: '帳款違約的連鎖反應',
              effects: { success: { roots: -10, incomeChange: -30 } },
              condition: { lifeline: 'roots', below: 40 }
            }}
          }
        }
      },
      {
        id: '001-B',
        label: '婉拒，提議分批交付',
        description: '拒絕整批出貨，改為按季分批交付並預收款 $80 萬。客戶根系 +8（建立信任）。',
        immediate: { cash: 80, roots: 8 },
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 6,
          isRandom: false,
          description: '客戶感受到專業態度，主動介紹兩個新客戶',
          attribution: '大客戶的好意：信任回報',
          effects: { success: { roots: 15, incomeChange: 60 } }
        }
      }
    ]
  },
  {
    id: '002',
    name: '明星員工求去',
    type: 'event',
    yearRange: [2, 4],
    description: '公司最能幹的員工敲門進來：「老闆，有人出我兩倍薪水。我不想走，但家裡需要錢。」',
    isPredictionTarget: true,
    options: [
      {
        id: '002-A',
        label: '個人加薪 + 留任獎金',
        description: '花 $80 萬留住他。但其他人會知道——公平問題遲早爆發。',
        immediate: { cash: -80, heartbeat: 3 },
        lockConditions: [{ lifeline: 'cashPercent', above: 40, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 3,
          isRandom: false,
          description: '其他員工得知加薪消息，公平感崩潰',
          attribution: '明星員工求去：公平危機',
          effects: { success: { heartbeat: -12, cash: -60 } }
        }
      },
      {
        id: '002-B',
        label: '設計全員虛擬股權方案',
        description: '花 $30 萬設計制度，心跳 +8（全員受惠），但客戶短期少了關注（根系 -5）。',
        immediate: { cash: -30, heartbeat: 8, roots: -5 },
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 5,
          isRandom: false,
          description: '股權制度發酵，團隊凝聚力大增',
          attribution: '明星員工求去：制度紅利',
          effects: { success: { heartbeat: 12, roots: 6 } }
        }
      }
    ]
  },
  {
    id: '003',
    name: '年度目標拉鋸',
    type: 'event',
    yearRange: [1, 3],
    description: '年度目標會議上，業務團隊和你僵持不下。他們說：「去年的目標已經夠高了，今年不能再加。」你手上有兩個方案。',
    options: [
      {
        id: '003-A',
        label: '降低目標 20%',
        description: '團隊鬆一口氣（心跳 +6），但客戶覺得你在放慢腳步（根系 -3）。',
        immediate: { heartbeat: 6, roots: -3 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 4,
          isRandom: false,
          description: '團隊養成「只要叫就降」的習慣，動力下滑',
          attribution: '年度目標拉鋸：慣性依賴',
          effects: { success: { heartbeat: -8, roots: -6 } }
        }
      },
      {
        id: '003-B',
        label: '維持目標，導入增量績效算法',
        description: '花 $50 萬建立新績效系統。短期有陣痛（心跳 -2），但長期可能激發潛力。',
        immediate: { cash: -50, heartbeat: -2 },
        lockConditions: [{ lifeline: 'cashPercent', above: 45, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '增量績效算法開始發酵，員工看到付出有回報',
          attribution: '年度目標拉鋸：制度紅利',
          effects: { success: { heartbeat: 10, roots: 5, cash: -40 } }
        }
      }
    ]
  },
  {
    id: '004',
    name: '景氣崩潰',
    type: 'crisis',
    yearRange: [3, 5],
    description: '全球經濟急轉直下。你的產業訂單量一個月內砍半。現金只夠撐幾季。所有人看著你等一個決定。',
    isPredictionTarget: true,
    options: [
      {
        id: '004-A',
        label: '裁員 20%，保住現金',
        description: '季固定支出降 25%（約 -$35 萬/季），但團隊士氣崩潰（心跳 -15）。',
        immediate: { expenseChange: -35, heartbeat: -15 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 3,
          isRandom: false,
          description: '裁員消息傳開，客戶觀望',
          attribution: '景氣崩潰：裁員後遺症',
          effects: { success: { roots: -8, heartbeat: 4 } }
        }
      },
      {
        id: '004-B',
        label: '逆勢加碼，綁定核心團隊',
        description: '花 $150 萬發留任獎金。團隊感動（心跳 +8），但現金大幅減少。',
        immediate: { cash: -150, heartbeat: 8 },
        lockConditions: [{ lifeline: 'cashPercent', above: 45, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 3,
          isRandom: false,
          description: '景氣回暖時，核心團隊全員在位，立即反彈',
          attribution: '景氣崩潰：團隊紅利',
          effects: { success: { heartbeat: 6, roots: 10 } }
        }
      }
    ],
    sideOption: {
      id: '004-S',
      label: '同時啟動緊急客戶維護',
      description: '額外花 $40 萬維護客戶關係，根系損失減半。',
      immediate: { cash: -40 },
      lockConditions: [{ lifeline: 'cashPercent', above: 35, reason: '現金不足' }]
    }
  },
  {
    id: '005',
    name: '前後台薪酬失衡',
    type: 'crisis',
    yearRange: [2, 4],
    description: '後勤部門集體來找你：「業務拿提成拿到手軟，我們加班到死薪水一樣。」你知道這問題存在很久了。',
    options: [
      {
        id: '005-A',
        label: '後台加薪 15%',
        description: '每季多花 $45 萬（持續），士氣微升（心跳 +4）。治標不治本。',
        immediate: { expenseChange: 45, heartbeat: 4 },
        lockConditions: [{ lifeline: 'cashPercent', above: 40, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 4,
          isRandom: false,
          description: '加薪效果消退，前台開始不滿「憑什麼後台漲我不漲」',
          attribution: '薪酬失衡：治標反噬',
          effects: { success: { heartbeat: -10, cash: -30 } }
        }
      },
      {
        id: '005-B',
        label: '導入前後台聯動薪酬機制',
        description: '花 $80 萬重新設計薪酬結構。短期陣痛（心跳 -3），但長期能根治。',
        immediate: { cash: -80, heartbeat: -3 },
        lockConditions: [{ lifeline: 'heartbeat', above: 35, reason: '團隊無力承接' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 5,
          isRandom: false,
          description: '聯動機制開始運作，前後台合作大幅改善',
          attribution: '薪酬失衡：結構紅利',
          effects: { success: { heartbeat: 10, expenseChange: -10, roots: 4 } }
        }
      }
    ],
    sideOption: {
      id: '005-S',
      label: '召開全員溝通大會',
      description: '不花錢但要面對：心跳 +3，根系 -2（分心）。',
      immediate: { heartbeat: 3, roots: -2 },
      lockConditions: []
    }
  },
  {
    id: '006',
    name: '股權激勵要求',
    type: 'event',
    yearRange: [3, 5],
    description: '三位核心高管聯名來找你：「我們跟公司這麼多年，想要一點股份。不多，5% 就好。」',
    isPredictionTarget: true,
    options: [
      {
        id: '006-A',
        label: '給 5% 實股',
        description: '立刻穩住人心（心跳 +10），但股權一旦給出就收不回來。',
        immediate: { heartbeat: 10 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 6,
          isRandom: false,
          description: '實股持有者開始要求分紅，利益衝突浮現',
          attribution: '股權激勵：實股代價',
          effects: {
            success: { heartbeat: -8, cash: -100, chainedFuse: {
              sourceOption: 'A-chain',
              detonateAt: 2,
              isRandom: false,
              description: '股權分歧引發內部派系',
              attribution: '股權激勵：派系問題',
              effects: { success: { heartbeat: -6 } },
              condition: { lifeline: 'heartbeat', below: 50 }
            }}
          }
        }
      },
      {
        id: '006-B',
        label: '動態虛擬股（績效連動分紅權）',
        description: '花 $40 萬設計方案。心跳 +5，但沒有實股那麼激動人心。',
        immediate: { cash: -40, heartbeat: 5 },
        lockConditions: [{ lifeline: 'cashPercent', above: 40, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 6,
          isRandom: false,
          description: '虛擬股制度成熟，高管全力衝刺績效',
          attribution: '股權激勵：制度紅利',
          effects: { success: { heartbeat: 8, cash: -60 } }
        }
      }
    ]
  },
  {
    id: '007',
    name: '薪酬總額失控',
    type: 'crisis',
    yearRange: [3, 5],
    description: '財務報表出來：薪酬佔營收比從 40% 飆到 58%。每季淨虧 $20 萬。再不處理，半年就斷糧。',
    isPredictionTarget: true,
    options: [
      {
        id: '007-A',
        label: '裁員 15% + 凍薪',
        description: '季支出立刻降 $50 萬（淨額轉正），但團隊士氣暴跌（心跳 -12）。',
        immediate: { expenseChange: -50, heartbeat: -12 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 3,
          isRandom: false,
          description: '裁員後剩餘員工人心惶惶，客戶服務品質下降',
          attribution: '薪酬失控：裁員後遺症',
          effects: { success: { roots: -10, heartbeat: 3 } }
        }
      },
      {
        id: '007-B',
        label: '薪酬結構重設（降固定、升浮動）',
        description: '花 $60 萬設計新制度，2 季後季支出降 $30 萬。短期心跳 -5。',
        immediate: { cash: -60, heartbeat: -5 },
        lockConditions: [{ lifeline: 'cashPercent', above: 30, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '浮動薪酬制度成熟，成本結構大幅優化',
          attribution: '薪酬失控：結構紅利',
          effects: { success: { heartbeat: 8, expenseChange: -15 } }
        }
      }
    ],
    sideOption: {
      id: '007-S',
      label: '同時加碼業務團隊激勵',
      description: '額外花 $30 萬刺激業績，預計下季收入 +$50 萬。根系 +5。',
      immediate: { cash: -30, roots: 5 },
      lockConditions: [{ lifeline: 'cashPercent', above: 35, reason: '現金不足' }]
    }
  },
  {
    id: '008',
    name: '跨界競爭者進入',
    type: 'event',
    yearRange: [2, 5],
    description: '一家資金雄厚的科技公司殺入你的市場，用補貼搶客戶。價格比你低 30%。你的業務團隊開始慌了。',
    options: [
      {
        id: '008-A',
        label: '降價迎戰',
        description: '利潤壓縮（季淨額從 +$35 萬降到 +$10 萬，持續），短期保住客戶（根系 +3），但團隊累（心跳 -4）。',
        immediate: { incomeChange: -25, roots: 3, heartbeat: -4 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 5,
          isRandom: false,
          description: '價格陷阱：降下去就回不來了，客戶習慣低價',
          attribution: '跨界競爭：價格陷阱',
          effects: { success: { roots: -12 } }
        }
      },
      {
        id: '008-B',
        label: '不降價，投資技術與服務壁壘',
        description: '花 $100 萬建護城河。短期流失一些客戶（根系 -6），但團隊有方向（心跳 +5）。',
        immediate: { cash: -100, roots: -6, heartbeat: 5 },
        lockConditions: [{ lifeline: 'cashPercent', above: 50, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 5,
          isRandom: false,
          description: '壁壘建成，跨界者發現打不動你，轉攻其他市場',
          attribution: '跨界競爭：壁壘紅利',
          effects: { success: { roots: 15, incomeChange: 10 } }
        }
      }
    ]
  },
  {
    id: '009',
    name: '即時激勵缺失',
    type: 'chronic',
    yearRange: [2, 4],
    description: '你注意到一個問題：團隊做完一個大案子，要等到季末才有獎金。等到那時候，成就感早就涼了。HR 建議導入即時獎金系統。',
    options: [
      {
        id: '009-A',
        label: '立即導入即時獎金制度',
        description: '花 $80 萬建系統 + 獎金池。心跳 +2（開始運作）。',
        immediate: { cash: -80, heartbeat: 2 },
        lockConditions: [{ lifeline: 'cashPercent', above: 45, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 3,
          isRandom: false,
          description: '即時激勵開始發威，員工主動性大增',
          attribution: '即時激勵：制度紅利',
          effects: { success: { heartbeat: 10, roots: 5, cash: -40 } }
        }
      },
      {
        id: '009-B',
        label: '再觀察一下',
        description: '不花錢，但問題惡化中（心跳 -5，根系 -3）。下次出現時成本 +50%。',
        immediate: { heartbeat: -5, roots: -3 },
        lockConditions: []
      }
    ]
  },
  {
    id: '010',
    name: '業績提成衝突',
    type: 'event',
    yearRange: [2, 4],
    description: '業務部老大找你：「老客戶的提成和新客戶一樣，誰還願意去開發新客戶？我建議新客戶提成 3 倍。」',
    options: [
      {
        id: '010-A',
        label: '新客戶提成 3 倍',
        description: '花 $30 萬調整系統。心跳 +2（業務團隊開心）。',
        immediate: { cash: -30, heartbeat: 2 },
        lockConditions: [],
        fuse: {
          sourceOption: 'A',
          detonateAt: 4,
          isRandom: false,
          description: '老客戶被冷落，新客戶衝量但不穩定',
          attribution: '提成衝突：結構失衡',
          effects: { success: { roots: 4, heartbeat: -6 } }
        }
      },
      {
        id: '010-B',
        label: '多維度 KPI（營收 + 新客 + 滿意度）',
        description: '花 $50 萬重新設計考核體系。短期陣痛（心跳 -4）。',
        immediate: { cash: -50, heartbeat: -4 },
        lockConditions: [{ lifeline: 'heartbeat', above: 40, reason: '團隊無力承接' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '多維 KPI 開始發揮作用，業務團隊全面進化',
          attribution: '提成衝突：制度紅利',
          effects: { success: { roots: 10, heartbeat: 8, cash: -45 } }
        }
      }
    ]
  },
  {
    id: '011',
    name: '客戶集中度危機',
    type: 'chronic',
    yearRange: [2, 4],
    description: '你突然發現：前三大客戶佔營收 72%。如果任何一家走了，公司立刻進入危機模式。',
    isPredictionTarget: true,
    options: [
      {
        id: '011-A',
        label: '啟動客戶多元化計畫',
        description: '花 $90 萬開發中小客戶。短期根系 -3（大客戶覺得被冷落），心跳 +3。',
        immediate: { cash: -90, roots: -3, heartbeat: 3 },
        lockConditions: [{ lifeline: 'cashPercent', above: 50, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 5,
          isRandom: false,
          description: '中小客戶群成形，營收結構健康化',
          attribution: '客戶集中度：多元化紅利',
          effects: { success: { roots: 15, incomeChange: 50 } }
        }
      },
      {
        id: '011-B',
        label: '再觀察一下',
        description: '不花錢，但風險在累積（根系 -4）。下次出現時成本 +50%。',
        immediate: { roots: -4 },
        lockConditions: []
      }
    ]
  },
  {
    id: '012',
    name: '組織文化稀釋',
    type: 'chronic',
    yearRange: [3, 5],
    description: '公司從 20 人長到 80 人。新人佔一半以上。你發現開會時「那個氛圍」不見了。老員工私下抱怨：「現在跟以前完全不一樣。」',
    options: [
      {
        id: '012-A',
        label: '啟動文化重塑計畫',
        description: '花 $70 萬辦工作坊、建制度。心跳 +2，但短期根系 -3（分心）。',
        immediate: { cash: -70, heartbeat: 2, roots: -3 },
        lockConditions: [{ lifeline: 'heartbeat', above: 40, reason: '團隊無力承接' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 5,
          isRandom: false,
          description: '文化制度落地，新老融合，組織凝聚力大增',
          attribution: '文化稀釋：文化紅利',
          effects: { success: { heartbeat: 12, roots: 4 } }
        }
      },
      {
        id: '012-B',
        label: '再觀察一下',
        description: '不花錢，但文化持續稀釋（心跳 -6，根系 -2）。下次出現時成本 +50%。',
        immediate: { heartbeat: -6, roots: -2 },
        lockConditions: []
      }
    ]
  },
  {
    id: '013',
    name: '合夥人攤牌',
    type: 'event',
    yearRange: [2, 4],
    description: '你的合夥人拍桌子：「我們必須轉型線上，我要投 $300 萬做電商平台。你要是不同意，我就退出。」',
    isPredictionTarget: true,
    options: [
      {
        id: '013-A',
        label: '同意合夥人的計畫',
        description: '投入 $300 萬。心跳 +6（團隊興奮），但根系 -4（現有客戶被冷落）。',
        immediate: { cash: -300, heartbeat: 6, roots: -4 },
        lockConditions: [{ lifeline: 'cashPercent', above: 55, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 5,
          isRandom: true,
          successRate: 0.6,
          description: '線上平台結果揭曉',
          attribution: '合夥人攤牌：創業結果',
          effects: {
            success: { incomeChange: 80, roots: 12 },
            failure: { cash: -100, heartbeat: -8 }
          }
        }
      },
      {
        id: '013-B',
        label: '拒絕，買回合夥人股份',
        description: '花 $120 萬買斷。心跳 -10（合夥人離開的震盪），根系 -3。',
        immediate: { cash: -120, heartbeat: -10, roots: -3 },
        lockConditions: [{ lifeline: 'cashPercent', above: 40, reason: '現金不足' }],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '獨立經營漸入佳境，決策效率提升',
          attribution: '合夥人攤牌：獨立紅利',
          effects: { success: { heartbeat: 8, roots: 5 } }
        }
      }
    ]
  },
  {
    id: '014',
    name: '海外大單',
    type: 'event',
    yearRange: [3, 5],
    description: '東南亞一家大企業要下 $200 萬的訂單，但要求你在當地設辦事處。這是國際化的機會，也是巨大的風險。',
    options: [
      {
        id: '014-A',
        label: '接單，設立海外辦事處',
        description: '花 $150 萬設點，$200 萬應收帳款（2 季後到）。心跳 -5（人力分散），根系 +3。',
        immediate: { cash: -150, ar: 200, heartbeat: -5, roots: 3 },
        lockConditions: [
          { lifeline: 'cashPercent', above: 55, reason: '現金不足' },
          { lifeline: 'heartbeat', above: 50, reason: '團隊無力承接' }
        ],
        fuse: {
          sourceOption: 'A',
          detonateAt: 6,
          isRandom: false,
          description: '海外業務逐漸穩定，但帳款只收回 $160 萬',
          attribution: '海外大單：國際化成果',
          effects: { success: { cash: -40, incomeChange: 50, roots: 10, expenseChange: 30 } }
        }
      },
      {
        id: '014-B',
        label: '婉拒，專注國內深耕',
        description: '專心做好現有客戶。心跳 +3，根系 +5。',
        immediate: { heartbeat: 3, roots: 5 },
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '國內客戶 100% 續約，口碑帶來新客戶',
          attribution: '海外大單：深耕紅利',
          effects: { success: { roots: 8, incomeChange: 20 } }
        }
      }
    ]
  },
  {
    id: '015',
    name: '技術債爆發',
    type: 'chronic',
    yearRange: [3, 5],
    description: '系統又當機了。這已經是這個月第三次。CTO 告訴你：「我們欠了三年的技術債，不全面重構就只會越來越糟。」',
    options: [
      {
        id: '015-A',
        label: '全面技術重構（暫停新功能 2 季）',
        description: '花 $120 萬。心跳 +3（工程師興奮），但根系 -6（客戶等新功能）。',
        immediate: { cash: -120, heartbeat: 3, roots: -6 },
        lockConditions: [{ lifeline: 'cashPercent', above: 45, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 4,
          isRandom: false,
          description: '重構完成，系統穩定性大增，運營成本下降',
          attribution: '技術債爆發：重構紅利',
          effects: { success: { heartbeat: 10, roots: 8, expenseChange: -20 } }
        }
      },
      {
        id: '015-B',
        label: '再觀察一下',
        description: '不花錢，但系統繼續惡化（心跳 -4，根系 -3）。下次出現時成本 +50%。',
        immediate: { heartbeat: -4, roots: -3 },
        lockConditions: []
      }
    ]
  },
  {
    id: '016',
    name: '供應商壟斷',
    type: 'crisis',
    yearRange: [2, 4],
    description: '你唯一的核心供應商通知：「原料漲價 40%，接受就繼續合作，不接受就斷貨。」你查了一圈，短期內沒有替代品。',
    options: [
      {
        id: '016-A',
        label: '接受漲價，同時開發備援供應商',
        description: '季成本 +$35 萬（持續到備援就緒），花 $80 萬開發備援。',
        immediate: { expenseChange: 35, cash: -80 },
        lockConditions: [{ lifeline: 'cashPercent', above: 45, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 5,
          isRandom: false,
          description: '備援供應商上線，原供應商被迫恢復原價',
          attribution: '供應商壟斷：備援紅利',
          effects: { success: { expenseChange: -35, roots: 5 } }
        }
      },
      {
        id: '016-B',
        label: '硬槓，賭供應商會讓步',
        description: '不花錢，但冒斷貨風險。',
        immediate: {},
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 2,
          isRandom: false,
          description: '供應商不讓步，斷貨一季',
          attribution: '供應商壟斷：斷貨危機',
          effects: { success: { roots: -15, cash: -100, heartbeat: -5 } }
        }
      }
    ],
    sideOption: {
      id: '016-S',
      label: '部分成本轉嫁客戶',
      description: '漲價影響減半（成本只 +$18 萬/季），但根系 -4。',
      immediate: { roots: -4 },
      lockConditions: [{ lifeline: 'roots', above: 40, reason: '客戶信任不足' }]
    }
  },
  {
    id: '017',
    name: '數據安全事件',
    type: 'event',
    yearRange: [3, 5],
    description: '凌晨三點，CTO 打電話來：「我們被駭了。客戶資料外洩。」你有兩個選擇，而且必須在天亮前決定。',
    isPredictionTarget: true,
    options: [
      {
        id: '017-A',
        label: '全面透明 + 全額賠償',
        description: '花 $150 萬處理。根系 -5（短期衝擊），但心跳 +4（團隊認同做對的事）。',
        immediate: { cash: -150, roots: -5, heartbeat: 4 },
        lockConditions: [{ lifeline: 'cashPercent', above: 50, reason: '現金不足' }],
        fuse: {
          sourceOption: 'A',
          detonateAt: 3,
          isRandom: false,
          description: '誠實處理贏得客戶信任，成為業界標竿',
          attribution: '數據安全：誠信紅利',
          effects: { success: { roots: 12, heartbeat: 5 } }
        }
      },
      {
        id: '017-B',
        label: '低調處理，只通知受影響客戶',
        description: '花 $50 萬小範圍處理。根系 -2，心跳 -3。',
        immediate: { cash: -50, roots: -2, heartbeat: -3 },
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 4,
          isRandom: false,
          description: '媒體以「公司試圖掩蓋」角度報導，信任崩潰',
          attribution: '數據安全：掩蓋反噬',
          effects: { success: { roots: -20, cash: -120, heartbeat: -8 } }
        }
      }
    ]
  },
  {
    id: '018',
    name: '內部創業提案',
    type: 'event',
    yearRange: [2, 5],
    description: '你最有創意的產品經理帶著一份商業計畫來找你：「老闆，讓我帶三個人試試這個新方向。六個月見成效。」',
    options: [
      {
        id: '018-A',
        label: '批准內部創業',
        description: '投入 $100 萬。心跳 +5（創新氛圍），但根系 -5（主業分心）。',
        immediate: { cash: -100, heartbeat: 5, roots: -5 },
        lockConditions: [
          { lifeline: 'cashPercent', above: 55, reason: '現金不足' },
          { lifeline: 'heartbeat', above: 50, reason: '團隊無力承接' }
        ],
        fuse: {
          sourceOption: 'A',
          detonateAt: 6,
          isRandom: true,
          successRate: 0.55,
          description: '內部創業結果揭曉',
          attribution: '內部創業：結果',
          effects: {
            success: { incomeChange: 60, heartbeat: 10 },
            failure: { cash: -50, heartbeat: -3 }
          }
        }
      },
      {
        id: '018-B',
        label: '暫緩，留人在主線',
        description: '不花錢，但心跳 -3（創意被壓抑），根系 +3。',
        immediate: { heartbeat: -3, roots: 3 },
        lockConditions: [],
        fuse: {
          sourceOption: 'B',
          detonateAt: 3,
          isRandom: false,
          description: 'PM 心灰意冷離職，帶走兩個人，去競爭對手做出了那個產品',
          attribution: '內部創業：人才流失',
          effects: { success: { heartbeat: -8, roots: -6 } }
        }
      }
    ]
  }
];
