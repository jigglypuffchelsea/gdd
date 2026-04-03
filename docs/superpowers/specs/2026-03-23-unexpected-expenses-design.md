# System D: 意外支出

Date: 2026-03-23

## 概述

新增意外支出系統，靈感來自《現金流》的 Doodad 卡。每季開始時有機率觸發，強制扣除現金，增加財務壓力和不可預測性。

## 資料模型

### 新增型別（types.ts）

```typescript
export interface ExpenseCard {
  id: string;
  name: string;
  description: string;
  tier: 'small' | 'medium' | 'large';
  cost: number;
}
```

### GamePhase 新增 `'expense'`

### GameState 新增欄位

```typescript
currentExpenseCard: ExpenseCard | null;
```

### createInitialState() 初始值

```typescript
currentExpenseCard: null,
```

## 觸發機制

每季開始時（investment 之前），根據 `state.lifelines.cashPercent` 判定觸發機率：
- cashPercent > 60% → 30% 機率
- cashPercent 40~60% → 50% 機率
- cashPercent < 40% → 80% 機率

**Q1Y1 豁免**：遊戲第一季（index === 0）不觸發意外支出，讓玩家有機會先行動。

觸發時從 12 張卡中**均勻隨機**抽 1 張，進入 `expense` phase。
未觸發則跳過，直接進 investment phase。

卡片不追蹤已使用狀態，允許重複抽到（12 張 × 20 季，重複是預期的）。

## 流程順序

```
(季初) expense → investment → entropy → decision/opportunity → prediction → settlement → attribution → market → deal → 下一季
```

### startQuarter() 修改

`startQuarter()` 現有邏輯設 `phase = 'investment'`，改為：
1. 先呼叫 `tryDrawExpense(state)`
2. 若觸發，回傳 `{ ...state, phase: 'expense', currentExpenseCard: card }`
3. 若未觸發，回傳原邏輯（`phase = 'investment'`，抽決策卡等）

### beginGame() 修改

`beginGame` 在 `useGame.ts` 中目前硬編碼 `phase: 'investment'` 再呼叫 `startQuarter`。
修改為：`beginGame` 只設初始狀態，然後呼叫 `startQuarter`，由 `startQuarter` 統一決定進 expense 或 investment。
但因為 Q1Y1 豁免，第一季 `startQuarter` 中 `tryDrawExpense` 會直接跳過（index === 0）。

### 所有 startQuarter 呼叫點

`startQuarter` 在 `useGame.ts` 中被以下地方呼叫：
1. `beginGame` — 遊戲開始
2. `doAdvance` — attribution 結束後（已改為進 market，但 auto-skip 路徑呼叫 startQuarter）
3. `doFinishMarket` — 股市結束後
4. `doBuyDeal` — 買入交易後
5. `doSkipDeal` — 跳過交易後

所有路徑都通過 `startQuarter` 統一入口，修改 `startQuarter` 即可覆蓋所有場景。

## expense phase 操作

- 顯示意外支出卡：名稱、描述、金額、檔次標籤
- 只有一個按鈕：「支付 $XX萬 →」
- 點擊後呼叫 `payExpense`

### payExpense 邏輯

1. 扣現金：`cash = Math.max(0, cash - card.cost)`
2. 重算動脈：`cashPercent = calcArtery(cash, effectiveExpense)`
3. 清除 `currentExpenseCard = null`
4. **執行 checkGameOver**：若 cash <= 0 或動脈 <= 0，設 `phase = 'gameOver'`
5. 若未 game over，設 `phase = 'investment'` 繼續正常流程

### QuarterLog 記錄

QuarterLog 新增可選欄位：
```typescript
expensePaid?: { cardId: string; cost: number };
```

`payExpense` 中記錄到當季 log。

## 卡片內容（12 張）

### 小意外（4 張，$15~25萬）
| ID | 名稱 | 金額 | 描述 |
|----|------|------|------|
| exp-s1 | 辦公室漏水維修 | $15萬 | 天花板漏水損壞了一批文件和設備，需要緊急維修。 |
| exp-s2 | 員工團建聚餐 | $20萬 | 團隊士氣低落，HR 建議辦一場大型團建活動提振氣氛。 |
| exp-s3 | 電腦設備更新 | $20萬 | 多台工作電腦同時故障，必須緊急採購替換。 |
| exp-s4 | 商標註冊費用 | $25萬 | 發現有人搶註了你的品牌商標，需要花錢申訴和重新註冊。 |

### 中意外（4 張，$30~50萬）
| ID | 名稱 | 金額 | 描述 |
|----|------|------|------|
| exp-m1 | 關鍵設備維修 | $30萬 | 生產線上的核心設備突然故障，停工一週等待零件。 |
| exp-m2 | 客戶退貨賠償 | $35萬 | 一批產品出現品質問題，大客戶要求全額退貨並索賠。 |
| exp-m3 | 消防安檢罰款 | $40萬 | 消防檢查發現違規項目，被開出罰單並要求限期改善。 |
| exp-m4 | 供應商漲價補差 | $50萬 | 主要原料供應商突然大幅漲價，短期內找不到替代來源。 |

### 大意外（4 張，$60~80萬）
| ID | 名稱 | 金額 | 描述 |
|----|------|------|------|
| exp-l1 | 核心專利侵權訴訟 | $60萬 | 競爭對手指控你的產品侵犯了他們的專利，律師費加和解金。 |
| exp-l2 | 稅務稽查補繳 | $70萬 | 國稅局來查帳，發現前幾年的稅務申報有誤，需要補繳加罰款。 |
| exp-l3 | 資安事件善後 | $75萬 | 公司遭到駭客攻擊，客戶資料外洩，需要緊急處理和公關善後。 |
| exp-l4 | 廠房設備重大故障 | $80萬 | 廠房的中央空調和電力系統同時故障，需要大規模更換。 |

## 引擎函數（gameEngine.ts）

- `tryDrawExpense(state): GameState` — Q1Y1 跳過；根據 cashPercent 機率判定；抽卡設 phase='expense' 或回傳原 state 不改 phase
- `payExpense(state): GameState` — 扣現金（不低於 0）、recalcArtery、checkGameOver、清 currentExpenseCard、設 phase='investment' 或 'gameOver'

## UI 組件

### ExpensePanel.tsx

紅色警告風格面板：
- 紅色漸層 header 顯示檔次（小意外 ⚡ / 中意外 ⚡⚡ / 大意外 ⚡⚡⚡）
- 卡片名稱、描述
- 金額顯示（大字紅色）
- 「支付 $XX萬 →」按鈕
- 若現金不足，按鈕文字改為「支付 $XX萬（現金不足，將扣至 $0）→」

### App.tsx 修改

- import ExpensePanel
- 在 phase 渲染中加入 expense phase

### useGame.ts 修改

- import tryDrawExpense, payExpense
- `beginGame`：移除硬編碼 `phase: 'investment'`，改為呼叫 startQuarter（startQuarter 內部處理 expense 判定）
- 新增 `doPayExpense` 回呼：呼叫 payExpense

## 影響範圍

### 修改的檔案
- `types.ts` — 新增 ExpenseCard, GamePhase 'expense', GameState.currentExpenseCard, QuarterLog.expensePaid
- `gameEngine.ts` — 新增 tryDrawExpense, payExpense；修改 startQuarter 流程
- `useGame.ts` — 新增 doPayExpense；修改 beginGame
- `App.tsx` — 新增 expense phase 渲染

### 新增的檔案
- `data/expenseCards.ts` — 12 張意外支出卡資料
- `components/ExpensePanel.tsx` — 意外支出面板
