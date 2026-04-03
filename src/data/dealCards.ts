import { DealCard } from '../engine/types';

export const dealCards: DealCard[] = [
  // === Small Deals (6) ===
  {
    id: 'deal-s1',
    name: '社區早餐店加盟',
    description: '投資一家社區早餐連鎖加盟店，穩定的客源帶來持續收入。',
    type: 'small',
    cost: 50,
    cashflow: 8,
  },
  {
    id: 'deal-s2',
    name: '出租套房',
    description: '購入一間小套房出租，每季穩定收取租金。',
    type: 'small',
    cost: 40,
    cashflow: 6,
  },
  {
    id: 'deal-s3',
    name: '自動販賣機網絡',
    description: '在幾個人流量大的地點設置自動販賣機，低維護成本的被動收入。',
    type: 'small',
    cost: 30,
    cashflow: 5,
  },
  {
    id: 'deal-s4',
    name: '線上課程平台',
    description: '投資開發線上課程，一次製作後持續銷售產生收入。',
    type: 'small',
    cost: 60,
    cashflow: 10,
  },
  {
    id: 'deal-s5',
    name: '停車場經營權',
    description: '取得一塊空地的停車場經營權，位置好的停車場收入穩定。',
    type: 'small',
    cost: 70,
    cashflow: 12,
  },
  {
    id: 'deal-s6',
    name: '洗衣店連鎖加盟',
    description: '加盟一家自助洗衣店，投幣式設備幾乎不需人力管理。',
    type: 'small',
    cost: 80,
    cashflow: 15,
  },

  // === Big Deals (3, require artery > 50%) ===
  {
    id: 'deal-b1',
    name: '收購競爭對手工廠',
    description: '併購一家面臨資金困難的競爭對手，整合產能提升規模效益。',
    type: 'big',
    cost: 200,
    cashflow: 40,
    arteryRequirement: 50,
  },
  {
    id: 'deal-b2',
    name: '商業地產投資',
    description: '購入一棟商業大樓收租，穩定的長期被動收入來源。',
    type: 'big',
    cost: 250,
    cashflow: 45,
    arteryRequirement: 50,
  },
  {
    id: 'deal-b3',
    name: '子公司併購',
    description: '收購一家互補型公司作為子公司，擴大業務版圖。',
    type: 'big',
    cost: 180,
    cashflow: 35,
    arteryRequirement: 50,
  },

  // === Stocks (3, reserved for C system — NOT in active pool) ===
  {
    id: 'deal-x1',
    name: '新創科技公司股份',
    description: '一家有潛力的 AI 新創公司正在募資，你可以低價買入股份。',
    type: 'stock',
    cost: 30,
    cashflow: 0,
    marketValue: 30,
    volatility: 'high',
  },
  {
    id: 'deal-x2',
    name: '生技公司股份',
    description: '一家研發新藥的生技公司，股價波動大但前景看好。',
    type: 'stock',
    cost: 40,
    cashflow: 0,
    marketValue: 40,
    volatility: 'high',
  },
  {
    id: 'deal-x3',
    name: '綠能產業基金',
    description: '投資綠能產業的 ETF 基金，跟著產業趨勢走。',
    type: 'stock',
    cost: 20,
    cashflow: 0,
    marketValue: 20,
    volatility: 'low',
  },
];

// Active pool excludes stocks (reserved for C system)
export const activeDealCards = dealCards.filter(c => c.type !== 'stock');

// Stock cards for market system
export const stockDealCards = dealCards.filter(c => c.type === 'stock');
