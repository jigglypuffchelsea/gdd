#!/usr/bin/env python3
"""
《熵與奮鬥者》模擬器 v4.0
重建版：含執行卡、戰略計畫軌道、三路選擇、級聯型

用途：跑 8 局（4 風格 × 2 牌組輪替），驗證數值平衡
目標：存活率 6/8、計畫完成率合理、伏筆觸發率合理
"""

import random
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ─── 常數 ───

SEASONS = 20  # 5 年 × 4 季
INITIAL_CASH = 392
INITIAL_ARTERY = 70.0
INITIAL_HEARTBEAT = 70
INITIAL_ROOTS = 55
INITIAL_REVENUE = 180
INITIAL_EXPENSE = 140

CAP = 100  # 命脈上限
FLOOR = 0  # 命脈下限 = Game Over


class Style(Enum):
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"
    SMART_AGGRESSIVE = "smart_aggressive"


class SeasonType(Enum):
    DECISION = "D"
    OPERATION = "O"


# ─── 伏筆 ───

@dataclass
class Foreshadow:
    name: str
    trigger_season: int  # 絕對季度
    effects: dict  # {"cash": x, "heartbeat": x, "roots": x, "expense_delta": x, "revenue_delta": x}
    condition: Optional[str] = None  # "heartbeat<55" 等條件式
    alt_effects: Optional[dict] = None  # 條件不滿足時的效果


# ─── 戰略計畫 ───

@dataclass
class Project:
    name: str
    min_year: int
    startup_threshold_type: str  # "roots", "heartbeat", "artery"
    startup_threshold: int
    maintain_threshold: int
    prepay: int
    maintain_cost: int = 15  # /季
    duration: int = 4
    reward_roots: int = 0
    reward_heartbeat: int = 0
    reward_revenue_delta: int = 0
    reward_expense_delta: int = 0
    reward_cash: int = 0
    reward_heartbeat_floor: Optional[int] = None
    foreshadow_delay: int = 0
    foreshadow_condition: Optional[str] = None
    foreshadow_effects: Optional[dict] = None
    foreshadow_alt_effects: Optional[dict] = None
    has_foreshadow: bool = True

    # 運行狀態
    active: bool = False
    progress: int = 0  # 0-4
    stalled: int = 0  # 連續停滯季數
    boosted: bool = False
    completed: bool = False
    abandoned: bool = False
    cooldown: int = 0


ALL_PROJECTS = [
    Project(
        name="新市場開拓", min_year=2,
        startup_threshold_type="roots", startup_threshold=45, maintain_threshold=40,
        prepay=80, reward_roots=12, reward_revenue_delta=20,
        foreshadow_delay=3, foreshadow_condition="heartbeat<55",
        foreshadow_effects={"roots": -8}, foreshadow_alt_effects={},
    ),
    Project(
        name="技術壁壘", min_year=2,
        startup_threshold_type="heartbeat", startup_threshold=55, maintain_threshold=50,
        prepay=100, reward_heartbeat=5, reward_expense_delta=-10,
        foreshadow_delay=4, foreshadow_effects={"roots": 5, "heartbeat": 3},
        has_foreshadow=True, foreshadow_condition=None,
    ),
    Project(
        name="人才梯隊", min_year=3,
        startup_threshold_type="artery", startup_threshold=50, maintain_threshold=40,
        prepay=90, reward_heartbeat=8, reward_heartbeat_floor=30,
        has_foreshadow=False,
    ),
    Project(
        name="品牌升級", min_year=3,
        startup_threshold_type="roots", startup_threshold=55, maintain_threshold=50,
        prepay=90, reward_roots=8, reward_revenue_delta=15,
        foreshadow_delay=2, foreshadow_effects={"roots_decay_increase": 1},
    ),
    Project(
        name="供應鏈優化", min_year=2,
        startup_threshold_type="artery", startup_threshold=45, maintain_threshold=35,
        prepay=70, reward_expense_delta=-15, reward_cash=40,
        foreshadow_delay=3, foreshadow_effects={},  # 條件觸發：遇 E-04/E-02 翻倍
        foreshadow_condition="entropy_vulnerable",
    ),
]


# ─── 遊戲狀態 ───

@dataclass
class GameState:
    cash: float = INITIAL_CASH
    heartbeat: int = INITIAL_HEARTBEAT
    roots: int = INITIAL_ROOTS
    revenue: int = INITIAL_REVENUE
    expense: int = INITIAL_EXPENSE
    expense_delta: int = 0  # 永久性支出變化
    revenue_delta: int = 0  # 永久性收入變化
    season: int = 0  # 0-19
    alive: bool = True
    heartbeat_floor: int = 0  # 人才梯隊效果

    foreshadows: list = field(default_factory=list)
    projects: list = field(default_factory=list)
    active_project: Optional[Project] = None
    project_cooldown: int = 0
    completed_projects: list = field(default_factory=list)

    log: list = field(default_factory=list)
    opportunity_cash: float = 0  # 商機累計

    @property
    def artery(self) -> float:
        effective_expense = self.expense + self.expense_delta
        if effective_expense <= 0:
            return 100.0
        val = self.cash / (effective_expense * 4) * 100
        return min(100.0, max(0.0, val))

    @property
    def effective_revenue(self) -> int:
        return self.revenue + self.revenue_delta

    @property
    def effective_expense(self) -> int:
        return self.expense + self.expense_delta

    @property
    def year(self) -> int:
        return self.season // 4 + 1

    @property
    def quarter(self) -> int:
        return self.season % 4 + 1

    @property
    def season_label(self) -> str:
        return f"Y{self.year}Q{self.quarter}"

    @property
    def season_type(self) -> SeasonType:
        return SeasonType.DECISION if self.season % 2 == 0 else SeasonType.OPERATION

    def clamp(self):
        self.heartbeat = max(self.heartbeat_floor, min(CAP, self.heartbeat))
        self.roots = max(FLOOR, min(CAP, self.roots))
        if self.cash <= 0:
            self.cash = 0
            self.alive = False

    def apply(self, effects: dict):
        self.cash += effects.get("cash", 0)
        self.heartbeat += effects.get("heartbeat", 0)
        self.roots += effects.get("roots", 0)
        self.expense_delta += effects.get("expense_delta", 0)
        self.revenue_delta += effects.get("revenue_delta", 0)
        self.clamp()

    def snapshot(self) -> str:
        return f"${self.cash:.0f} A{self.artery:.1f}% H{self.heartbeat} R{self.roots} Rev${self.effective_revenue}"


# ─── 飛輪與螺旋 ───

def apply_flywheel(gs: GameState):
    """正向飛輪 + 死亡螺旋"""
    # 正向
    if gs.heartbeat > 65:
        gs.roots += 2
    if gs.roots > 65:
        gs.heartbeat += 2
    if gs.roots > 55:
        bonus = int(gs.effective_revenue * 0.10)
        gs.cash += bonus
    if gs.heartbeat > 75:
        gs.cash += int(gs.effective_expense * 0.05)  # 省成本

    # 死亡螺旋
    if gs.heartbeat < 35:
        gs.roots -= 4
    if gs.roots < 25:
        gs.heartbeat -= 3
    if gs.roots < 25:
        gs.cash -= int(gs.effective_revenue * 0.15)
    if gs.artery < 30:
        gs.heartbeat -= 5
    if gs.artery < 25:
        gs.roots -= 3
    if gs.heartbeat < 25:
        gs.cash -= int(gs.effective_expense * 0.08)

    gs.clamp()


# ─── 自然衰減 ───

def apply_decay(gs: GameState):
    gs.heartbeat -= 2
    gs.roots -= 1
    gs.clamp()


# ─── 基礎收支 ───

def apply_income_expense(gs: GameState):
    net = gs.effective_revenue - gs.effective_expense
    # 活躍計畫維護費
    if gs.active_project and gs.active_project.active:
        net -= gs.active_project.maintain_cost
    gs.cash += net
    gs.clamp()


# ─── 商機系統（營運季 40-65% 動脈區間觸發） ───

OPPORTUNITIES = [
    ("政府補助", {"cash": 80}),
    ("戰略合作", {"cash": 120, "roots": 5}),
    ("旺季", {}),  # 動態計算
    ("口碑轉介紹", {"cash": 30, "roots": 3}),
    ("老客戶加單", {"cash": 50}),
    ("技術授權", {"cash": 150}),
    ("行業獎項", {"roots": 8}),  # cash 動態
    ("應收提前到帳", {"cash": 40}),
]


def roll_opportunity(gs: GameState) -> Optional[tuple]:
    if gs.season_type != SeasonType.OPERATION:
        return None
    # 40-65% 動脈區間有較高機率
    base_chance = 0.45
    if 40 <= gs.artery <= 65:
        base_chance = 0.65
    elif gs.artery > 80:
        base_chance = 0.35

    if random.random() < base_chance:
        opp = random.choice(OPPORTUNITIES)
        name, effects = opp
        effects = dict(effects)  # copy
        if name == "旺季":
            effects["cash"] = int(gs.effective_revenue * random.uniform(0.25, 0.40))
        elif name == "行業獎項":
            effects["cash"] = int(20 + gs.roots * 0.3)
        return name, effects
    return None


# ─── 決策牌效果（簡化版，含三路與級聯） ───

def get_decision_effects(gs: GameState, style: Style) -> tuple:
    """回傳 (效果dict, 伏筆list, 描述str)"""
    foreshadows = []

    # 基於風格和遊戲狀態的隨機決策效果
    if style == Style.CONSERVATIVE:
        # 保守：選低成本選項
        effects = random.choice([
            {"cash": -30, "heartbeat": 3, "roots": 3},  # 溫和投資
            {"cash": -50, "roots": 5},  # 花錢保客
            {"heartbeat": 2},  # 微調
        ])
        # 保守型遇到三路牌：60% 選 C（看起來穩妥）
        if random.random() < 0.3:  # 三路牌機率
            if random.random() < 0.6:
                # 選 C（通常是陷阱）
                effects = {"cash": -20, "heartbeat": 1}
                foreshadows.append(Foreshadow(
                    "折衷陷阱", gs.season + 3,
                    {"heartbeat": -6}
                ))

    elif style == Style.BALANCED:
        effects = random.choice([
            {"cash": -80, "heartbeat": 5},
            {"cash": -50, "roots": 5},
            {"cash": -30, "heartbeat": 3, "roots": 3},
            {"roots": -5, "heartbeat": 8},
        ])
        # 平衡型：伏筆較好
        if random.random() < 0.5:
            foreshadows.append(Foreshadow(
                "績效見效", gs.season + 4,
                {"heartbeat": 8, "roots": 5, "cash": -40}
            ))

    elif style == Style.AGGRESSIVE:
        effects = random.choice([
            {"cash": -120, "heartbeat": 6, "roots": -3},
            {"cash": -100, "roots": 8},
            {"cash": -80, "heartbeat": 8, "roots": -2},
        ])
        # 激進：高風險伏筆
        if random.random() < 0.4:
            if random.random() < 0.5:
                foreshadows.append(Foreshadow(
                    "高風險回報", gs.season + 5,
                    {"cash": 100, "roots": 10}
                ))
            else:
                foreshadows.append(Foreshadow(
                    "高風險崩盤", gs.season + 3,
                    {"roots": -15, "cash": -80}
                ))

    else:  # SMART_AGGRESSIVE
        # 聰明激進：根據狀態選最佳，現金不夠時收手
        if gs.artery < 40:
            effects = {"cash": -20, "heartbeat": 3}  # 低成本保命
        elif gs.roots < 60:
            effects = {"cash": -60, "roots": 6}
        elif gs.heartbeat < 60:
            effects = {"cash": -50, "heartbeat": 6}
        else:
            effects = {"cash": -70, "roots": 4, "heartbeat": 4}

        if random.random() < 0.45:
            foreshadows.append(Foreshadow(
                "結構優化", gs.season + 4,
                {"heartbeat": 8, "roots": 4, "cash": -30}
            ))

    # 投資選擇（每季最多 2 項）
    invest = get_investment(gs, style)
    for inv_eff in invest:
        for k, v in inv_eff.items():
            effects[k] = effects.get(k, 0) + v

    return effects, foreshadows


def get_investment(gs: GameState, style: Style) -> list:
    """根據風格選擇投資"""
    investments = []
    if style == Style.CONSERVATIVE:
        if gs.artery > 60 and gs.heartbeat < 65:
            investments.append({"cash": -60, "heartbeat": 7})
        elif gs.artery > 55 and gs.roots < 60:
            investments.append({"cash": -50, "roots": 5})
    elif style == Style.BALANCED:
        if gs.heartbeat < gs.roots and gs.artery > 50:
            investments.append({"cash": -60, "heartbeat": 7})
        elif gs.artery > 50:
            investments.append({"cash": -50, "roots": 5})
        if gs.artery > 65 and len(investments) < 2:
            investments.append({"cash": -80, "roots": 4})
    elif style == Style.AGGRESSIVE:
        investments.append({"cash": -80, "heartbeat": 5})
        if gs.artery > 40:
            investments.append({"cash": -60, "roots": 4})
    else:  # SMART_AGGRESSIVE
        if gs.artery < 45:
            pass  # 動脈低時不投資
        else:
            weakest = min(gs.heartbeat, gs.roots)
            if weakest == gs.heartbeat:
                investments.append({"cash": -60, "heartbeat": 7})
            else:
                investments.append({"cash": -50, "roots": 5})
            if gs.artery > 65 and len(investments) < 2:
                if gs.roots < gs.heartbeat:
                    investments.append({"cash": -50, "roots": 4})
                else:
                    investments.append({"cash": -60, "heartbeat": 5})
    return investments


# ─── 執行卡（營運季） ───

EXECUTION_CARDS = [
    # (name, option_a_effects, option_b_effects, option_b_foreshadow, auto_effects)
    ("老客戶要折扣",
     {"cash": -20, "roots": 3}, None, None, {"roots": -1}),
    ("加班趕交付",
     {"cash": 30, "heartbeat": -4}, None,
     Foreshadow("團隊信任", 0, {"heartbeat": 5}),  # delay set dynamically
     {"heartbeat": -1}),
    ("供應商漲價",
     {"cash": -25}, None, None, {"cash": -15}),
    ("員工私下抱怨",
     {"cash": -15, "heartbeat": 3}, None,
     Foreshadow("治本改善", 0, {"heartbeat": 6}),
     {"heartbeat": -2}),
    ("媒體邀約曝光",
     {"heartbeat": -2, "roots": 4}, None,
     Foreshadow("口碑傳播", 0, {"roots": 2}),
     {}),
]


def apply_execution_card(gs: GameState, style: Style):
    """營運季抽 2 選 1"""
    drawn = random.sample(EXECUTION_CARDS, min(2, len(EXECUTION_CARDS)))
    if len(drawn) < 2:
        return

    # 風格決定選哪張
    chosen_idx = 0
    auto_idx = 1

    card = drawn[chosen_idx]
    name, opt_a, opt_b, opt_b_fs, auto_eff = card

    # 風格決定選 A 或 B
    if style in (Style.CONSERVATIVE, Style.BALANCED):
        # 保守/平衡：偏好確定型（A）
        gs.apply(opt_a)
    else:
        # 激進/聰明激進：偏好延遲型（B）
        if opt_b_fs:
            fs = Foreshadow(opt_b_fs.name, gs.season + 3, opt_b_fs.effects)
            gs.foreshadows.append(fs)
        else:
            gs.apply(opt_a)

    # 另一張自動結算
    auto_card = drawn[auto_idx]
    gs.apply(auto_card[4])  # auto effects
    gs.clamp()


# ─── 熵牌 ───

def apply_entropy(gs: GameState):
    """每季 30% 機率觸發熵牌"""
    if random.random() > 0.30:
        return

    entropy_effects = random.choice([
        {"cash": -60, "desc": "設備故障"},
        {"cash": -30, "heartbeat": -4, "desc": "輿論危機"},
        {"roots": -5, "cash": -20, "desc": "客戶投訴"},
        {"heartbeat": -6, "roots": -4, "desc": "社群危機"},
        {"cash": -35, "desc": "法規變動"},
    ])

    desc = entropy_effects.pop("desc", "熵事件")

    # 供應鏈優化伏筆：若處於脆弱期，效果翻倍
    for p in gs.completed_projects:
        if p.name == "供應鏈優化" and hasattr(p, '_vulnerable_until'):
            if gs.season <= p._vulnerable_until:
                entropy_effects = {k: v * 2 for k, v in entropy_effects.items()}
                desc += "（供應鏈脆弱×2）"

    gs.apply(entropy_effects)
    gs.log.append(f"  熵牌：{desc}")


# ─── 戰略計畫邏輯 ───

def get_metric(gs: GameState, metric_type: str) -> float:
    if metric_type == "roots":
        return gs.roots
    elif metric_type == "heartbeat":
        return gs.heartbeat
    elif metric_type == "artery":
        return gs.artery
    return 0


def try_start_project(gs: GameState, style: Style):
    """嘗試啟動計畫"""
    if gs.active_project or gs.project_cooldown > 0:
        return

    # 危機中不啟動
    if gs.artery < 30 or gs.heartbeat < 30 or gs.roots < 30:
        return

    # 風格門檻
    if style == Style.CONSERVATIVE:
        if gs.artery < 65:
            return
    elif style == Style.BALANCED:
        if gs.artery < 60:
            return
    elif style == Style.AGGRESSIVE:
        if gs.artery < 45:
            return
    else:  # SMART_AGGRESSIVE
        if gs.artery < 55:
            return

    # 找最弱命脈對應的計畫
    available = []
    for p_template in ALL_PROJECTS:
        if p_template.name in [cp.name for cp in gs.completed_projects]:
            continue
        if gs.year < p_template.min_year:
            continue
        if get_metric(gs, p_template.startup_threshold_type) <= p_template.startup_threshold:
            continue
        available.append(p_template)

    if not available:
        return

    # 優先最弱命脈
    weakest = "roots" if gs.roots <= gs.heartbeat else "heartbeat"
    if gs.artery < min(gs.heartbeat, gs.roots):
        weakest = "artery"

    preferred = [p for p in available if p.startup_threshold_type == weakest]
    chosen = preferred[0] if preferred else available[0]

    # 創建副本
    import copy
    project = copy.deepcopy(chosen)
    project.active = True
    project.progress = 0
    gs.active_project = project
    gs.cash -= project.prepay
    gs.clamp()
    gs.log.append(f"  🔶 啟動計畫：{project.name}（預付 ${project.prepay} 萬）")


def advance_project(gs: GameState, style: Style):
    """推進計畫進度"""
    p = gs.active_project
    if not p or not p.active:
        return

    p.progress += 1

    # Q2 里程碑
    if p.progress == 2:
        threshold_val = get_metric(gs, p.startup_threshold_type)
        if threshold_val >= p.maintain_threshold:
            gs.log.append(f"  📊 {p.name} Q2 里程碑通過")
            # 加碼判斷
            if style in (Style.AGGRESSIVE, Style.SMART_AGGRESSIVE) and gs.artery > 50:
                p.boosted = True
                gs.cash -= 50
                gs.log.append(f"  ⏫ 加碼 ${50} 萬")
            p.stalled = 0
        else:
            p.stalled += 1
            gs.log.append(f"  ⚠️ {p.name} Q2 里程碑停滯（{p.startup_threshold_type} < {p.maintain_threshold}）")

    # Q4 完成
    elif p.progress >= 4:
        threshold_val = get_metric(gs, p.startup_threshold_type)
        if threshold_val >= p.maintain_threshold:
            # 完成！
            complete_project(gs, p)
        else:
            # 失敗
            p.active = False
            gs.heartbeat -= 3  # 失敗懲罰（放棄的 50%）
            gs.log.append(f"  ❌ {p.name} 完成失敗（{p.startup_threshold_type} < {p.maintain_threshold}）")
            gs.active_project = None
            gs.project_cooldown = 2
            gs.clamp()
        return

    # 停滯處理
    if p.stalled >= 2:
        p.active = False
        p.abandoned = True
        gs.heartbeat -= 5
        gs.log.append(f"  ❌ {p.name} 連續停滯 2 季，自動放棄")
        gs.active_project = None
        gs.project_cooldown = 2
        gs.clamp()


def complete_project(gs: GameState, p: Project):
    p.completed = True
    p.active = False

    mult = 1.5 if p.boosted else 1.0
    gs.roots += int(p.reward_roots * mult)
    gs.heartbeat += int(p.reward_heartbeat * mult)
    gs.revenue_delta += int(p.reward_revenue_delta * mult)
    gs.expense_delta += int(p.reward_expense_delta * mult)
    gs.cash += int(p.reward_cash * mult)

    if p.reward_heartbeat_floor:
        gs.heartbeat_floor = max(gs.heartbeat_floor,
                                  p.reward_heartbeat_floor + (5 if p.boosted else 0))

    gs.completed_projects.append(p)
    gs.active_project = None
    gs.clamp()

    boost_label = "（加碼）" if p.boosted else ""
    gs.log.append(f"  ✅ {p.name} 完成{boost_label}")

    # 埋伏筆
    if p.has_foreshadow and p.foreshadow_effects:
        if p.foreshadow_condition == "entropy_vulnerable":
            # 供應鏈特殊：標記脆弱期
            p._vulnerable_until = gs.season + p.foreshadow_delay
        elif p.foreshadow_condition:
            gs.foreshadows.append(Foreshadow(
                f"{p.name}伏筆", gs.season + p.foreshadow_delay,
                p.foreshadow_effects,
                condition=p.foreshadow_condition,
                alt_effects=p.foreshadow_alt_effects
            ))
        else:
            gs.foreshadows.append(Foreshadow(
                f"{p.name}伏筆", gs.season + p.foreshadow_delay,
                p.foreshadow_effects
            ))


# ─── 伏筆觸發 ───

def trigger_foreshadows(gs: GameState):
    triggered = []
    remaining = []
    for fs in gs.foreshadows:
        if gs.season >= fs.trigger_season:
            # 條件檢查
            if fs.condition:
                cond_met = eval_condition(gs, fs.condition)
                if cond_met:
                    gs.apply(fs.effects)
                    gs.log.append(f"  伏筆：{fs.name}")
                elif fs.alt_effects:
                    gs.apply(fs.alt_effects)
                    gs.log.append(f"  伏筆：{fs.name}（條件未達）")
                else:
                    gs.log.append(f"  伏筆：{fs.name}（條件未達，無效果）")
            else:
                gs.apply(fs.effects)
                gs.log.append(f"  伏筆：{fs.name}")
            triggered.append(fs)
        else:
            remaining.append(fs)
    gs.foreshadows = remaining


def eval_condition(gs: GameState, condition: str) -> bool:
    if condition == "heartbeat<55":
        return gs.heartbeat < 55
    elif condition == "entropy_vulnerable":
        return False  # 特殊處理
    return False


# ─── 年度結算 ───

def annual_settlement(gs: GameState):
    """每年 Q4 的年度收入成長"""
    if gs.quarter != 4:
        return

    avg_roots = gs.roots  # 簡化：用當前值
    avg_heartbeat = gs.heartbeat

    growth = 0
    if avg_roots >= 55 and avg_heartbeat >= 55:
        growth = 20
    elif avg_roots >= 50 or avg_heartbeat >= 50:
        growth = 10

    if growth > 0:
        gs.revenue += growth
        gs.log.append(f"  年度成長：季收入+${growth}萬")


# ─── 末季清算 ───

def end_game_cleanup(gs: GameState):
    """Y5Q4 末季伏筆 ×0.7 清算"""
    for fs in gs.foreshadows:
        scaled = {k: int(v * 0.7) for k, v in fs.effects.items() if isinstance(v, (int, float))}
        gs.apply(scaled)
        gs.log.append(f"  末季×0.7：{fs.name}")
    gs.foreshadows = []


# ─── 評分 ───

def calculate_score(gs: GameState) -> tuple:
    if not gs.alive:
        return 0, "F"

    score = 0
    # 動脈分
    score += int(gs.artery * 1.5)
    # 心跳分
    score += int(gs.heartbeat * 1.5)
    # 根系分
    score += int(gs.roots * 1.5)
    # 存活獎勵
    score += 50
    # 計畫獎勵
    score += len(gs.completed_projects) * 30

    if score >= 400:
        grade = "S"
    elif score >= 300:
        grade = "A"
    elif score >= 200:
        grade = "B"
    elif score >= 100:
        grade = "C"
    else:
        grade = "D"

    return score, grade


# ─── 主模擬迴圈 ───

def simulate_game(style: Style, seed: int = None) -> GameState:
    if seed is not None:
        random.seed(seed)

    gs = GameState()
    gs.log.append(f"=== {style.value} ===")

    for s in range(SEASONS):
        gs.season = s
        if not gs.alive:
            break

        st = gs.season_type
        gs.log.append(f"─ {gs.season_label} {st.value} {gs.snapshot()}")

        # 1. 收支結算
        apply_income_expense(gs)

        # 2. 熵牌
        apply_entropy(gs)
        if not gs.alive:
            gs.log.append(f"  ☠ 資金斷裂")
            break

        # 3. 決策牌 or 執行卡
        if st == SeasonType.DECISION:
            effects, foreshadows = get_decision_effects(gs, style)
            gs.apply(effects)
            gs.foreshadows.extend(foreshadows)
        else:
            apply_execution_card(gs, style)

        if not gs.alive:
            gs.log.append(f"  ☠ 資金斷裂")
            break

        # 4. 商機
        opp = roll_opportunity(gs)
        if opp:
            name, eff = opp
            gs.apply(eff)
            gs.opportunity_cash += eff.get("cash", 0)
            gs.log.append(f"  商機！{name}")

        # 5. 伏筆觸發
        trigger_foreshadows(gs)

        # 6. 飛輪/螺旋
        apply_flywheel(gs)

        # 7. 自然衰減
        apply_decay(gs)

        # 8. 計畫推進
        if gs.active_project:
            advance_project(gs, style)
        else:
            try_start_project(gs, style)

        # 計畫冷卻
        if gs.project_cooldown > 0:
            gs.project_cooldown -= 1

        # 年度結算
        annual_settlement(gs)

        if not gs.alive:
            gs.log.append(f"  ☠ 資金斷裂")
            break

        gs.log.append(f"  → {gs.snapshot()}")

    # 末季清算
    if gs.alive:
        end_game_cleanup(gs)

    score, grade = calculate_score(gs)
    gs.log.append(f"\n終局 {score}分 {grade}級 商機${gs.opportunity_cash:.0f}萬 Rev${gs.effective_revenue}")

    return gs


# ─── 跑 8 局 ───

def run_all():
    styles = [Style.CONSERVATIVE, Style.BALANCED, Style.AGGRESSIVE, Style.SMART_AGGRESSIVE]
    results = []

    print("=" * 70)
    print("  《熵與奮鬥者》模擬器 v4.0 — 含執行卡 + 戰略計畫軌道")
    print("=" * 70)
    print()

    # 摘要表頭
    print(f"{'':>8} {'局':>4} {'活':>3} {'季':>4} {'A%':>7} {'H':>5} {'R':>5} {'分':>6} {'級':>3} {'計畫':>10} {'商機$':>7} {'終Rev':>6}")
    print("-" * 80)

    for round_label, seed_base in [("輪A", 42), ("輪B", 99)]:
        for style in styles:
            seed = seed_base + list(Style).index(style) * 7
            gs = simulate_game(style, seed)

            alive = "✅" if gs.alive else "☠"
            seasons = gs.season + 1 if gs.alive else gs.season + 1
            proj_str = ", ".join(p.name[:4] for p in gs.completed_projects) or "—"

            score, grade = calculate_score(gs)

            style_label = {
                Style.CONSERVATIVE: "保守",
                Style.BALANCED: "平衡",
                Style.AGGRESSIVE: "激進",
                Style.SMART_AGGRESSIVE: "聰明激進",
            }[style]

            print(f"{round_label}-{style_label:>6} {alive:>3} {seasons:>3} "
                  f"{gs.artery:>6.1f}% {gs.heartbeat:>4} {gs.roots:>4} "
                  f"{score:>5} {grade:>3} {proj_str:>10} "
                  f"{gs.opportunity_cash:>6.0f}萬 ${gs.effective_revenue}")

            results.append({
                "round": round_label, "style": style_label,
                "alive": gs.alive, "seasons": seasons,
                "score": score, "grade": grade, "gs": gs,
            })

    # 統計
    print()
    print("=" * 70)
    alive_count = sum(1 for r in results if r["alive"])
    project_completions = sum(len(r["gs"].completed_projects) for r in results)
    foreshadow_triggers = sum(
        len([l for l in r["gs"].log if "伏筆：" in l and "末季" not in l])
        for r in results
    )

    print(f"存活率：{alive_count}/8  目標：6/8")
    print(f"計畫完成數：{project_completions}  目標：≥3")
    print(f"伏筆觸發數：{foreshadow_triggers}  目標：≥5")

    # 驗證
    checks = []
    if alive_count == 6:
        checks.append("✅ 存活率 6/8")
    elif alive_count in (5, 7):
        checks.append(f"⚠️ 存活率 {alive_count}/8（接近目標）")
    else:
        checks.append(f"❌ 存活率 {alive_count}/8（需調整）")

    if project_completions >= 3:
        checks.append(f"✅ 計畫完成 {project_completions} 個")
    else:
        checks.append(f"⚠️ 計畫完成 {project_completions} 個（偏低）")

    print()
    for c in checks:
        print(f"  {c}")

    # 問是否輸出詳細日誌
    print()
    print("詳細日誌請加 --verbose 參數")

    return results


def run_verbose():
    """輸出所有詳細日誌"""
    styles = [Style.CONSERVATIVE, Style.BALANCED, Style.AGGRESSIVE, Style.SMART_AGGRESSIVE]

    for round_label, seed_base in [("輪A", 42), ("輪B", 99)]:
        for style in styles:
            seed = seed_base + list(Style).index(style) * 7
            gs = simulate_game(style, seed)
            print("\n".join(gs.log))
            print()


if __name__ == "__main__":
    import sys
    if "--verbose" in sys.argv:
        run_verbose()
    else:
        run_all()
