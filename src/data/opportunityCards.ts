import { OpportunityCard } from '../engine/types';

export const opportunityCards: OpportunityCard[] = [
  {
    id: 'opp-gov-subsidy',
    name: '政府補助',
    description: '恭喜！公司符合政府產業補助條件，獲得一筆補助款。',
    effects: { cash: 80 },
  },
  {
    id: 'opp-strategic-partner',
    name: '戰略合作',
    description: '一家大企業看中你的產品，提出戰略合作方案，帶來資金與客戶資源。',
    effects: { cash: 120, roots: 5 },
  },
  {
    id: 'opp-referral',
    name: '口碑轉介紹',
    description: '滿意的老客戶主動介紹新客戶上門，口碑效應帶來額外收入。',
    effects: { cash: 30, roots: 3 },
  },
  {
    id: 'opp-peak-season',
    name: '旺季',
    description: '市場進入旺季，訂單量明顯上升，營收按比例增長。',
    effects: { revenuePercent: 0.3 },
  },
  {
    id: 'opp-tech-license',
    name: '技術授權',
    description: '你的技術被其他公司看中，獲得一筆技術授權費。',
    effects: { cash: 150 },
  },
  {
    id: 'opp-existing-client',
    name: '老客戶加單',
    description: '現有客戶對服務滿意，主動增加訂單量。',
    effects: { cash: 50 },
  },
  {
    id: 'opp-industry-award',
    name: '行業獎項',
    description: '公司獲得行業重要獎項，品牌知名度大幅提升，帶來新客戶。',
    effects: { cash: 40, roots: 8 },
  },
  {
    id: 'opp-early-payment',
    name: '應收提前到帳',
    description: '客戶提前支付應收帳款，現金流提前入帳。',
    effects: { cash: 40 },
  },
];
