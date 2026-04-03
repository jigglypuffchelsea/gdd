# System C: 市場波動/股票交易 + System B: 財務儀表板

Date: 2026-03-23

## 概述

為遊戲「熵與奮鬥者」新增兩個系統：
- **System C**：解鎖股票交易，加入市價波動機制，獨立股市 phase
- **System B**：側邊欄淨資產摘要 + 彈窗式財務儀表板（含 SVG 折線圖）

---

## System C: 市場波動 / 股票交易

### 資料模型

#### 新增型別（types.ts）

```typescript
export interface StockHolding {
  id: string;
  dealCardId: string;    // deal-x1, deal-x2, deal-x3
  name: string;
  purchasePrice: number; // 買入時的市價
  acquiredAt: number;    // quarter index
}

export interface MarketPrices {
  [dealCardId: string]: number;
}
```

**StockHolding vs Asset 邊界**：股票只存在 `state.stocks` 中，不進入 `state.assets`。兩者完全分離：
- `state.assets` — 小型/大型交易，有 cashflow，Step 1.5 結算被動收入
- `state.stocks` — 股票持倉，無 cashflow，透過市價漲跌獲利

#### DealCard 型別擴充

```typescript
// types.ts 中 DealCard 新增欄位
export interface DealCard {
  ...existing fields...
  volatility?: 'high' | 'low';  // 僅股票使用
}
```

#### GamePhase 新增 `'market'`

#### GameState 新增欄位

```typescript
stocks: StockHolding[];
marketPrices: MarketPrices;
marketPriceHistory: MarketPrices[];   // 每季末快照
netWorthHistory: number[];            // 每季末淨資產
marketTradesThisQuarter: { bought: boolean; sold: boolean }; // 每季交易限制追蹤
```

#### createInitialState() 初始值

```typescript
stocks: [],
marketPrices: { 'deal-x1': 30, 'deal-x2': 40, 'deal-x3': 20 },
marketPriceHistory: [],
netWorthHistory: [],
marketTradesThisQuarter: { bought: false, sold: false },
```

#### advanceQuarter() 重置

`advanceQuarter` 中需額外重置：
```typescript
marketTradesThisQuarter: { bought: false, sold: false },
```

#### 股票波動性格（dealCards.ts）

- deal-x1 科技股：`volatility: 'high'`（-20% ~ +25%）
- deal-x2 生技股：`volatility: 'high'`（-20% ~ +25%）
- deal-x3 綠能基金：`volatility: 'low'`（-8% ~ +12%）

### 市價波動機制

每季結算時執行（Settlement Step 1.7，在 Step 1.5 資產被動收入之後）：

```
updateMarketPrices(state):
  for each stock card:
    1. 基礎隨機波動:
       - high volatility: -20% ~ +25%
       - low volatility: -8% ~ +12%
    2. 根系加成:
       - roots > 60 → 全體股票 +5%
       - roots < 30 → 全體股票 -10%
    3. 心跳加成:
       - heartbeat > 70 → 科技股(deal-x1) 額外 +8%
    4. 新市價 = clamp(Math.floor(舊市價 × (1 + 總變動率)), 5, 500)
       // 下限 5 防止歸零，上限 500 防止指數爆炸
    5. 記錄到 settlement step 顯示漲跌
```

初始市價從 DealCard 的 `marketValue` 取得：`{ 'deal-x1': 30, 'deal-x2': 40, 'deal-x3': 20 }`

### 淨資產記錄時機

在 `runSettlement` 的最後一步（所有步驟包含 updateMarketPrices 之後），記錄：
```typescript
s.netWorthHistory = [...s.netWorthHistory, calcNetWorth(s)];
s.marketPriceHistory = [...s.marketPriceHistory, { ...s.marketPrices }];
```

### 流程順序

```
settlement → attribution → market phase → deal phase → 下一季
```

#### doAdvance 修改邏輯

```typescript
doAdvance():
  // attribution 結束後呼叫
  setState(prev => {
    return { ...prev, phase: 'market' };  // 先進股市
  });
```

#### doFinishMarket (新增)

```typescript
doFinishMarket():
  setState(prev => {
    const dealState = tryDrawDeal(prev);
    if (dealState.phase === 'deal') return dealState;
    const nextState = advanceQuarter(dealState);
    if (nextState.phase === 'victory') return nextState;
    return startQuarter(nextState);
  });
```

- `doAdvance` 只負責 attribution → market 的轉換
- `doFinishMarket` 負責 market → deal/下一季 的轉換
- 這樣職責分離，不會在 doAdvance 裡混雜邏輯

#### 自動跳過規則

若玩家持有 0 股且現金不足以買入任何股票（最便宜的市價），market phase 自動跳過，直接進入 `tryDrawDeal`。

### 股市 Phase 操作規則

- 面板顯示 3 支股票的當前市價、本季漲跌幅、持有數量
- **買入**：花現金以當前市價買 1 股（每季限 1 次）
- **賣出**：以當前市價賣出持有的 1 股（每季限 1 次）
- **完成**：結束股市操作，進入下一階段
- 買入需要現金 ≥ 市價
- 買/賣後按鈕變灰（已用本季額度）

### 新增引擎函數（gameEngine.ts）

- `updateMarketPrices(state): { state, step }` — 結算中呼叫，回傳更新後 state 和 settlement step
- `buyStock(state, dealCardId): GameState` — 以當前市價買入，扣現金，建立 StockHolding，設 bought=true
- `sellStock(state, holdingId): GameState` — 以當前市價賣出，加現金，移除 StockHolding，設 sold=true
- `calcNetWorth(state): number` — 現金 + Σ(asset.cost) + Σ(stock 當前市值) + AR
- `shouldAutoSkipMarket(state): boolean` — 檢查是否自動跳過

### 新增 UI 組件

- `MarketPanel.tsx` — 股市 phase 面板，顯示 3 支股票即時狀態與操作按鈕

### useGame.ts 新增回呼

- `doBuyStock(dealCardId: string)` — 呼叫 buyStock
- `doSellStock(holdingId: string)` — 呼叫 sellStock
- `doFinishMarket()` — 結束股市，進入 tryDrawDeal 流程

---

## System B: 財務儀表板

### 側邊欄增強（App.tsx）

在「財務摘要」區塊的「季淨額」之後新增：

```
淨資產  $XXX萬   [📊 詳情]
```

- 淨資產 = 現金 + 資產購入成本合計 + 股票當前市值合計 + 應收帳款
- 點「📊 詳情」開啟 dashboard 彈窗

### Dashboard 彈窗（FinancialDashboard.tsx）

#### 區塊一：SVG 折線圖

- X 軸：季度（Q1Y1 ~ 當前季）
- 兩條線：現金（藍）、淨資產（金）
- hover 顯示該季數值
- 資料來源：`netWorthHistory`、`quarterLogs` 中 `endState.financials.cash`
- 組件獨立為 `MiniChart.tsx`（~80 行手寫 SVG）

注意：原設計的「被動收入累計」線移除，因為 GameSnapshot 中沒有資產資訊無法回溯。兩條線（現金 + 淨資產）已足夠展示趨勢。

#### 區塊二：收支分解

左右兩欄：

收入欄：
- 基礎季收入
- 持續效果（income 類加總）
- 被動收入（assets cashflow 合計）
- 總收入

支出欄：
- 基礎季支出
- 持續效果（expense 類加總）
- 總支出

#### 區塊三：資產 & 持股明細

資產表：名稱、成本、每季收入、持有季數
持股表：名稱、買入價、現價、損益金額與百分比

### 新增 UI 組件

- `FinancialDashboard.tsx` — 彈窗組件
- `MiniChart.tsx` — SVG 折線圖組件

### App.tsx 變更

- 新增 `showDashboard` state（boolean）
- 側邊欄加淨資產行 + 📊 按鈕
- 渲染 `{showDashboard && <FinancialDashboard ... onClose={() => setShowDashboard(false)} />}`

---

## 影響範圍

### 修改的檔案
- `types.ts` — 新增 StockHolding, MarketPrices, DealCard.volatility, GamePhase 'market', GameState 新欄位
- `dealCards.ts` — 股票卡加 volatility 值
- `gameEngine.ts` — 新增市價波動步驟、股票交易函數、calcNetWorth、netWorth 記錄、advanceQuarter 重置
- `useGame.ts` — 新增 doBuyStock, doSellStock, doFinishMarket 回呼、修改 doAdvance 只進 market phase
- `App.tsx` — 加 market phase 渲染、dashboard 彈窗、側邊欄淨資產

### 新增的檔案
- `MarketPanel.tsx` — 股市交易面板
- `FinancialDashboard.tsx` — 財務儀表板彈窗
- `MiniChart.tsx` — SVG 折線圖

### 不變的檔案
- `DealPanel.tsx` — 不需修改，deal phase 保持原樣
- 其他既有組件不受影響
