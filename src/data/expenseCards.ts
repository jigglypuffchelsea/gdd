import { ExpenseCard } from '../engine/types';

export const expenseCards: ExpenseCard[] = [
  // === 小意外 (4, $15~25萬) ===
  {
    id: 'exp-s1',
    name: '辦公室漏水維修',
    description: '天花板漏水損壞了一批文件和設備，需要緊急維修。',
    tier: 'small',
    cost: 15,
  },
  {
    id: 'exp-s2',
    name: '員工團建聚餐',
    description: '團隊士氣低落，HR 建議辦一場大型團建活動提振氣氛。',
    tier: 'small',
    cost: 20,
  },
  {
    id: 'exp-s3',
    name: '電腦設備更新',
    description: '多台工作電腦同時故障，必須緊急採購替換。',
    tier: 'small',
    cost: 20,
  },
  {
    id: 'exp-s4',
    name: '商標註冊費用',
    description: '發現有人搶註了你的品牌商標，需要花錢申訴和重新註冊。',
    tier: 'small',
    cost: 25,
  },

  // === 中意外 (4, $30~50萬) ===
  {
    id: 'exp-m1',
    name: '關鍵設備維修',
    description: '生產線上的核心設備突然故障，停工一週等待零件。',
    tier: 'medium',
    cost: 30,
  },
  {
    id: 'exp-m2',
    name: '客戶退貨賠償',
    description: '一批產品出現品質問題，大客戶要求全額退貨並索賠。',
    tier: 'medium',
    cost: 35,
  },
  {
    id: 'exp-m3',
    name: '消防安檢罰款',
    description: '消防檢查發現違規項目，被開出罰單並要求限期改善。',
    tier: 'medium',
    cost: 40,
  },
  {
    id: 'exp-m4',
    name: '供應商漲價補差',
    description: '主要原料供應商突然大幅漲價，短期內找不到替代來源。',
    tier: 'medium',
    cost: 50,
  },

  // === 大意外 (4, $60~80萬) ===
  {
    id: 'exp-l1',
    name: '核心專利侵權訴訟',
    description: '競爭對手指控你的產品侵犯了他們的專利，律師費加和解金。',
    tier: 'large',
    cost: 60,
  },
  {
    id: 'exp-l2',
    name: '稅務稽查補繳',
    description: '國稅局來查帳，發現前幾年的稅務申報有誤，需要補繳加罰款。',
    tier: 'large',
    cost: 70,
  },
  {
    id: 'exp-l3',
    name: '資安事件善後',
    description: '公司遭到駭客攻擊，客戶資料外洩，需要緊急處理和公關善後。',
    tier: 'large',
    cost: 75,
  },
  {
    id: 'exp-l4',
    name: '廠房設備重大故障',
    description: '廠房的中央空調和電力系統同時故障，需要大規模更換。',
    tier: 'large',
    cost: 80,
  },
];
