import { InvestmentOption } from '../engine/types';

export const investmentOptions: InvestmentOption[] = [
  // --- Heartbeat (心跳) investments ---
  {
    id: 'inv-salary',
    name: '調薪/發獎金',
    cost: 60,
    immediate: { heartbeat: 7 },
    target: 'heartbeat',
  },
  {
    id: 'inv-training',
    name: '員工培訓',
    cost: 100,
    immediate: { heartbeat: 5 },
    persistent: { type: 'heartbeat', value: 3, quarters: 3 },
    target: 'heartbeat',
  },
  // --- Roots (根系) investments ---
  {
    id: 'inv-client-feedback',
    name: '客戶回饋',
    cost: 50,
    immediate: { roots: 5 },
    target: 'roots',
  },
  {
    id: 'inv-client-deepen',
    name: '客戶深耕',
    cost: 80,
    immediate: { roots: 4 },
    persistent: { type: 'roots', value: 3, quarters: 4 },
    target: 'roots',
  },
];
