# Asset / Passive Income System Design

> **Date:** 2026-03-22
> **Status:** Approved
> **Scope:** A system — first of four planned enrichment systems (A → C → B → D)

---

## 1. Overview

Add a Cashflow-inspired asset/passive income system to the CEO simulation game. Players can buy assets that generate passive cash income each quarter. This creates a secondary growth engine alongside the existing revenue/expense model.

**Core principle:** Assets only produce cash. Lifeline effects (heartbeat, roots) happen indirectly via the existing flywheel system — more cash → higher artery → flywheel triggers.

---

## 2. Data Model

### DealCard (交易機會牌)

```typescript
interface DealCard {
  id: string;
  name: string;
  description: string;
  type: 'small' | 'big' | 'stock';
  cost: number;              // Purchase cost (萬)
  cashflow: number;          // Passive income per quarter (萬), 0 for stocks
  marketValue?: number;      // For stocks, used by future C system
  arteryRequirement?: number; // Big deals: artery must exceed this value
}
```

### Asset (持有資產)

```typescript
interface Asset {
  id: string;
  dealCardId: string;     // Source deal card ID
  name: string;
  type: 'small' | 'big' | 'stock';
  cost: number;           // Purchase price
  cashflow: number;       // Per-quarter passive income
  acquiredAt: number;     // Quarter index when acquired
}
```

### GameState additions

```typescript
// New fields on GameState:
assets: Asset[];                    // Owned assets
currentDealCard: DealCard | null;   // Deal drawn this quarter (null if none)
```

### GamePhase addition

```typescript
'deal'  // Deal opportunity phase, after attribution
```

---

## 3. Deal Card Pool (9 active cards + 3 reserved)

**Note:** Stock cards are excluded from the active pool until the C system (market fluctuation) is implemented. They are defined in data but not drawn.

### Small Deals (6 cards)

| ID | Name | Cost | Cashflow/Q | Payback |
|----|------|------|-----------|---------|
| deal-s1 | 社區早餐店加盟 | $50萬 | +$8萬 | 6.3Q |
| deal-s2 | 出租套房 | $40萬 | +$6萬 | 6.7Q |
| deal-s3 | 自動販賣機網絡 | $30萬 | +$5萬 | 6.0Q |
| deal-s4 | 線上課程平台 | $60萬 | +$10萬 | 6.0Q |
| deal-s5 | 停車場經營權 | $70萬 | +$12萬 | 5.8Q |
| deal-s6 | 洗衣店連鎖加盟 | $80萬 | +$15萬 | 5.3Q |

### Big Deals (3 cards, require artery > 50%)

| ID | Name | Cost | Cashflow/Q | Payback |
|----|------|------|-----------|---------|
| deal-b1 | 收購競爭對手工廠 | $200萬 | +$40萬 | 5.0Q |
| deal-b2 | 商業地產投資 | $250萬 | +$45萬 | 5.6Q |
| deal-b3 | 子公司併購 | $180萬 | +$35萬 | 5.1Q |

### Stocks (3 cards — RESERVED, not in active pool until C system)

| ID | Name | Cost | Cashflow/Q | Note |
|----|------|------|-----------|------|
| deal-x1 | 新創科技公司股份 | $30萬 | $0 | Sell via market fluctuation (C system) |
| deal-x2 | 生技公司股份 | $40萬 | $0 | Sell via market fluctuation (C system) |
| deal-x3 | 綠能產業基金 | $20萬 | $0 | Sell via market fluctuation (C system) |

---

## 4. Game Flow Integration

### Quarter flow (updated)

```
Investment → Entropy → (Decision/Opportunity) → Prediction → Settlement (includes prediction check) → Attribution → 【Deal】 → Next Quarter
```

### Phase transition changes

The existing `doAdvance` callback (in `useGame.ts`) currently calls `advanceQuarter()` directly from the attribution phase. This must be changed:

1. **Attribution → Deal:** `doAdvance` now transitions to the deal phase instead of advancing the quarter. It rolls the trigger probability, and either sets `currentDealCard` + `phase = 'deal'`, or skips directly to `advanceQuarter()` if no deal triggers.
2. **Deal → Next Quarter:** After the player buys or skips, `advanceQuarter()` is called.
3. **Game Over guard:** If `checkGameOver()` returns true during settlement, the phase goes to `'gameOver'` and the deal phase is never reached. No deal cards are shown to dead players.

### Deal phase trigger logic

After attribution phase ends (and game is NOT over), calculate trigger probability based on current artery:

| Artery | Trigger Probability |
|--------|-------------------|
| > 60%  | 80% |
| 40-60% | 50% |
| < 40%  | 20% |

- Roll `Math.random()`. If triggered, draw 1 random card from the 9-card active pool (small + big only; with replacement — same deal can appear multiple times across quarters).
- If a big deal is drawn but player's artery ≤ `arteryRequirement`, the card is shown but the "Buy" button is locked with message "動脈不足".

### Player actions

- **Buy**: Deduct cost from cash, add asset to `assets[]`, recalculate artery. Player must have `cash >= cost` AND (for big deals) `artery > arteryRequirement`. If cash is negative or zero, Buy is disabled.
- **Skip**: Advance to next quarter.

### Prediction check timing

Prediction comparison is locked at settlement completion, BEFORE the deal phase. Buying assets does not affect prediction accuracy.

---

## 5. Settlement Engine Changes

### New step: Step 1.5 — Asset Passive Income

Insert after Step 1 (base income/expense), before Step 2 (persistent effects):

```
Step 1:   Base income/expense
Step 1.5: Asset passive income  ← NEW
Step 2:   Persistent effects
Step 3:   Fuse detonation
Step 4:   Flywheel / Death spiral
Step 5:   Update artery
Step 6:   Natural decay
Step 7:   Revenue growth engine (Q4)
```

**Step 1.5 logic:**
- Iterate through `state.assets`
- For each asset with `cashflow > 0`: add cashflow to cash
- Record each as a settlement step change for display

**Settlement panel display:**
```
Step 1.5: 資產被動收入
  🏪 社區早餐店           +8
  🏪 線上課程平台         +10
  🏢 商業地產投資         +45
```

### Design note: Artery impact of buying assets

Buying an asset immediately reduces cash and tanks artery. The passive income only flows in during the next settlement. This is intentional — it mirrors real business: large investments hurt short-term liquidity before generating returns. Players must manage the timing of asset purchases to avoid triggering death spirals. This is a core strategic tension.

---

## 6. UI Changes

### New component: DealPanel.tsx

- Shows deal card with type-colored header (green=small, orange=big, blue=stock)
- Displays: name, description, cost, cashflow/quarter, payback period
- Big deals show lock indicator if artery insufficient
- Two buttons: "買入 →" (disabled if can't afford or artery locked) and "跳過 →"
- Font size follows global setting (+2pt from base, currently 18px → will be 20px after font change)

### Sidebar additions (App.tsx left sidebar)

New section below "持續效果":

```
📦 持有資產 (N)
  🏪 社區早餐店     +$8萬/季
  🏪 線上課程平台   +$10萬/季
  🏢 商業地產投資   +$45萬/季
  ─────────────────
  被動收入合計：+$63萬/季
```

If no assets are held, this section is hidden.

### Financial summary update

Add "被動收入" line to the sidebar financial summary section, between 季支出 and 季淨額. Only shown if total passive income > 0.

---

## 7. Scoring Impact

**No scoring formula change needed.** Assets boost cash through passive income, which already feeds into the existing financial score formula (`financialScore = Math.min(30, cash / 20)`).

---

## 8. State Reset

`advanceQuarter()` must reset `currentDealCard` to `null` alongside the existing resets for `currentDecisionCards`, `currentEntropyCard`, `currentOpportunityCard`, and `selectedDecisionCard`.

`createInitialState()` must initialize `assets: []` and `currentDealCard: null`.

---

## 9. Files to Create/Modify

### New files:
- `src/data/dealCards.ts` — 12 deal card definitions (9 active + 3 reserved stocks)
- `src/components/DealPanel.tsx` — Deal opportunity UI

### Modified files:
- `src/engine/types.ts` — Add DealCard, Asset interfaces; add `'deal'` to GamePhase; add `assets`, `currentDealCard` to GameState
- `src/engine/gameEngine.ts` — Add `drawDealCard()`, `applyDeal()`, `skipDeal()` functions; update `runSettlement()` with Step 1.5 asset passive income; update `advanceQuarter()` to reset `currentDealCard`; update `createInitialState()` with new fields
- `src/hooks/useGame.ts` — Modify `doAdvance` to transition to deal phase; add `doBuyDeal()` and `doSkipDeal()` handlers
- `src/App.tsx` — Add deal phase rendering; add sidebar asset display section; add passive income to financial summary
- `src/index.css` — Font size 18px → 20px (separate from asset system, bundled for convenience)

---

## 10. Future: C System Integration Points

When the market fluctuation system (C) is built later:
- Stock cards are added to the active draw pool
- Stocks gain a `marketValue` that fluctuates each quarter
- A "Market Event" card type is added that enables selling stocks and assets
- Sell price = current marketValue (may be higher or lower than cost)
- The deal phase may be extended to show "sell opportunities" when market events trigger
- Asset interface gains optional `currentMarketValue` field

These are NOT implemented now — just noted as integration seams.
