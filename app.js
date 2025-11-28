/*********************
 * Solo Leveling MVP
 * - Tailwind + custom CSS
 * - Unified state + legacy migration
 * - Safer rendering (escape)
 * - Fixed XP/account XP bug, daily bonus application, negative clamping
 *********************/

const APP_KEY = "solo_mvp_state_v2";
const LEGACY_KEYS = {
  profile: "soloProfile",
  quests: "soloQuests",
  habits: "soloHabits",
  bosses: "soloBosses",
  rewards: "soloRewards",
  habitChecks: "soloHabitChecks",
  progressHistory: "soloProgressHistory",
  vision: "soloVision",
  antivi: "soloAntiVi"
};

const DIFFICULTY_XP = { easy: 10, medium: 25, hard: 50 };
const DURATION_MULT = { 15: 1, 30: 1.5, 60: 2, 120: 3 };

let xpChartInstance, questChartInstance, habitChartInstance;
let deferredPrompt = null; // Saved install prompt event for PWA

const defaultState = () => ({
  version: 2,
  profile: {
    userId: "user1",
    username: "Player",
    email: "",
    level: 1,
    levelXp: 0,
    accountXp: 0,
    gold: 0,
    rank: "E-rank Hunter",
    currentStreak: 0,
    bestStreak: 0,
    lastLoginDate: todayStr(),
    createdAt: new Date().toISOString(),
    dailyBonus: null
  },
  settings: {},
  quests: [],
  habits: [],
  bosses: [],
  rewards: [],
  habitChecks: {},
  progressHistory: [],
  vision: "",
  antivi: "",
  activity: []
});

const state = {
  data: defaultState()
};

// ---------- Helpers ----------

function $(sel) { return document.querySelector(sel); }

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e6).toString(36);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function todayStr(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getDefaultBosses() {
  return [
    {
      id: uid("b"),
      name: "Gate: Procrastination",
      unlockAccountXp: 150,
      xpReward: 80,
      goldReward: 40,
      tag: "Mindset",
      description: "Defeat by completing 3 quests in a single day. This gate tests your ability to take action consistently.",
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    },
    {
      id: uid("b"),
      name: "Gate: Laziness",
      unlockAccountXp: 300,
      xpReward: 150,
      goldReward: 75,
      tag: "Motivation",
      description: "Defeat by maintaining a 3-day streak. Break free from the chains of inactivity!",
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    },
    {
      id: uid("b"),
      name: "Gate: Distraction",
      unlockAccountXp: 500,
      xpReward: 200,
      goldReward: 100,
      tag: "Focus",
      description: "Defeat by completing a medium or hard quest without failing. Master your attention!",
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    },
    {
      id: uid("b"),
      name: "Gate: Self-Doubt",
      unlockAccountXp: 800,
      xpReward: 300,
      goldReward: 150,
      tag: "Mindset",
      description: "Defeat by reaching level 5. Prove to yourself that you can grow and improve!",
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    },
    {
      id: uid("b"),
      name: "Gate: Weak Willpower",
      unlockAccountXp: 1200,
      xpReward: 400,
      goldReward: 200,
      tag: "Discipline",
      description: "Defeat by maintaining a 7-day streak. Build unbreakable discipline!",
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    }
  ];
}

function getDefaultRewards() {
  return [
    {
      id: uid("r"),
      name: "Coffee Break",
      goldCost: 15,
      category: "Treat",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "30 min Gaming",
      goldCost: 30,
      category: "Fun",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Watch a Movie",
      goldCost: 50,
      category: "Entertainment",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Order Takeout",
      goldCost: 40,
      category: "Treat",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Buy Something Nice",
      goldCost: 100,
      category: "Reward",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Extra Sleep (30 min)",
      goldCost: 25,
      category: "Rest",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Social Media Time",
      goldCost: 20,
      category: "Fun",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: uid("r"),
      name: "Spa Day",
      goldCost: 150,
      category: "Wellness",
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    }
  ];
}

function getDefaultQuests() {
  const today = todayStr();
  
  return [
    {
      id: uid("q"),
      title: "Drink 8 glasses of water",
      difficulty: "easy",
      duration: 15,
      dueDate: today,
      category: "Health",
      status: "active",
      xpReward: 10,
      goldReward: 5,
      createdAt: new Date().toISOString(),
      completedAt: null
    },
    {
      id: uid("q"),
      title: "Do 20 pushups",
      difficulty: "easy",
      duration: 15,
      dueDate: today,
      category: "Fitness",
      status: "active",
      xpReward: 15,
      goldReward: 8,
      createdAt: new Date().toISOString(),
      completedAt: null
    },
    {
      id: uid("q"),
      title: "Read for 30 minutes",
      difficulty: "medium",
      duration: 30,
      dueDate: today,
      category: "Learning",
      status: "active",
      xpReward: 38,
      goldReward: 19,
      createdAt: new Date().toISOString(),
      completedAt: null
    },
    {
      id: uid("q"),
      title: "Take a 10-minute walk",
      difficulty: "easy",
      duration: 15,
      dueDate: today,
      category: "Health",
      status: "active",
      xpReward: 10,
      goldReward: 5,
      createdAt: new Date().toISOString(),
      completedAt: null
    },
    {
      id: uid("q"),
      title: "Meditate for 10 minutes",
      difficulty: "easy",
      duration: 15,
      dueDate: today,
      category: "Wellness",
      status: "active",
      xpReward: 12,
      goldReward: 6,
      createdAt: new Date().toISOString(),
      completedAt: null
    },
    {
      id: uid("q"),
      title: "Eat a healthy meal",
      difficulty: "easy",
      duration: 30,
      dueDate: today,
      category: "Health",
      status: "active",
      xpReward: 15,
      goldReward: 8,
      createdAt: new Date().toISOString(),
      completedAt: null
    }
  ];
}

function daysBetween(aYYYYMMDD, bYYYYMMDD) {
  const a = new Date(aYYYYMMDD + "T00:00:00Z");
  const b = new Date(bYYYYMMDD + "T00:00:00Z");
  return Math.floor((b - a) / 86400000);
}

function xpForNextLevel(lv) {
  return Math.floor(100 * Math.pow(1.6, lv - 1));
}

function getRank(level) {
  if (level >= 40) return "S-rank Hunter";
  if (level >= 30) return "A-rank Hunter";
  if (level >= 20) return "B-rank Hunter";
  if (level >= 10) return "C-rank Hunter";
  return "E-rank Hunter";
}

function getStreakMultiplier() {
  const streak = state.data.profile.currentStreak || 0;
  if (streak >= 100) return 2.0;
  if (streak >= 60) return 1.5;
  if (streak >= 30) return 1.25;
  if (streak >= 7) return 1.1;
  return 1.0;
}

function getDailyMultipliers() {
  const bonus = state.data.profile.dailyBonus;
  if (!bonus || bonus.date !== todayStr()) return { xpMult: 1, goldMult: 1 };
  return {
    xpMult: bonus.xpMult || 1,
    goldMult: bonus.goldMult || 1
  };
}


// ---------- Toasts ----------
function toast(message, type = "info") {
  const host = $("#toastHost");
  const el = document.createElement("div");
  el.className = "toast";

  const border = type === "error" ? "#ff3b4f" :
                 type === "success" ? "#33ce91" :
                 "#56cffe";

  el.style.borderLeft = `6px solid ${border}`;
  el.innerHTML = `<div class="text-sm font-semibold">${escapeHtml(message)}</div>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 240);
  }, 2800);
}

// ---------- Storage / Migration ----------
function safeLocalStorage() {
  try {
    const k = "__test__" + Math.random();
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch { return false; }
}

function computeAccountXpFromLevel(level, levelXp) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForNextLevel(i);
  total += Math.max(0, levelXp || 0);
  return total;
}

function importLegacyIfPresent() {
  const hasLegacy = Object.values(LEGACY_KEYS).some(k => localStorage.getItem(k));
  if (!hasLegacy) return null;

  try {
    const legacyProfile = JSON.parse(localStorage.getItem(LEGACY_KEYS.profile) || "null");
    const quests = JSON.parse(localStorage.getItem(LEGACY_KEYS.quests) || "[]");
    const habits = JSON.parse(localStorage.getItem(LEGACY_KEYS.habits) || "[]");
    const bosses = JSON.parse(localStorage.getItem(LEGACY_KEYS.bosses) || "[]");
    const rewards = JSON.parse(localStorage.getItem(LEGACY_KEYS.rewards) || "[]");
    const habitChecks = JSON.parse(localStorage.getItem(LEGACY_KEYS.habitChecks) || "{}");
    const progressHistory = JSON.parse(localStorage.getItem(LEGACY_KEYS.progressHistory) || "[]");
    const vision = localStorage.getItem(LEGACY_KEYS.vision) || "";
    const antivi = localStorage.getItem(LEGACY_KEYS.antivi) || "";

    const s = defaultState();
    if (legacyProfile) {
      s.profile.username = legacyProfile.username || s.profile.username;
      s.profile.level = legacyProfile.level || 1;
      // Legacy stored only level XP in profile.xp
      s.profile.levelXp = Math.max(0, legacyProfile.xp || 0);
      s.profile.accountXp = computeAccountXpFromLevel(s.profile.level, s.profile.levelXp);
      s.profile.gold = Math.max(0, legacyProfile.gold || 0);
      s.profile.rank = legacyProfile.rank || getRank(s.profile.level);
      s.profile.currentStreak = legacyProfile.currentStreak || 0;
      s.profile.bestStreak = legacyProfile.bestStreak || 0;
      s.profile.lastLoginDate = legacyProfile.lastLoginDate || todayStr();
      s.profile.createdAt = legacyProfile.createdAt || s.profile.createdAt;
      s.profile.dailyBonus = legacyProfile.dailyBonus || null;
    }

    s.quests = Array.isArray(quests) ? quests : [];
    s.habits = Array.isArray(habits) ? habits : [];
    s.bosses = Array.isArray(bosses) ? bosses : [];
    s.rewards = Array.isArray(rewards) ? rewards : [];
    s.habitChecks = habitChecks && typeof habitChecks === "object" ? habitChecks : {};
    s.vision = vision;
    s.antivi = antivi;

    // Convert progressHistory (legacy stored date, xp (levelXP), level)
    s.progressHistory = (Array.isArray(progressHistory) ? progressHistory : [])
      .map(p => ({
        date: p.date,
        accountXp: computeAccountXpFromLevel(p.level || 1, p.xp || 0),
        level: p.level || 1,
        gold: typeof p.gold === "number" ? p.gold : undefined
      }))
      .filter(p => p.date);

    return s;
  } catch (e) {
    console.warn("Legacy import failed", e);
    return null;
  }
}

function loadState() {
  if (!safeLocalStorage()) {
    toast("Local storage is unavailable. Progress won’t persist.", "error");
    state.data = defaultState();
    return;
  }

  const raw = localStorage.getItem(APP_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // basic sanity
      if (!parsed || !parsed.profile) throw new Error("Corrupt state");
      state.data = { ...defaultState(), ...parsed };
      // ensure nested defaults
      state.data.profile = { ...defaultState().profile, ...state.data.profile };
      state.data.settings = { ...defaultState().settings, ...state.data.settings };
      state.data.activity = Array.isArray(state.data.activity) ? state.data.activity : [];
      return;
    } catch {
      // If corrupt, try legacy
    }
  }

  const legacy = importLegacyIfPresent();
  if (legacy) {
    state.data = legacy;
    saveState();
    toast("Imported your previous data automatically.", "success");
    return;
  }

  // New user - add default content
  state.data = defaultState();
  state.data.quests = getDefaultQuests();
  state.data.bosses = getDefaultBosses();
  state.data.rewards = getDefaultRewards();
  saveState();
  toast("Welcome! Default quests, gates, and rewards have been added to get you started.", "success");
}

function saveState() {
  if (!safeLocalStorage()) return;
  try {
    // Save to localStorage - this persists until browser data is cleared
    localStorage.setItem(APP_KEY, JSON.stringify(state.data));
    // Add timestamp for debugging/recovery
    localStorage.setItem(APP_KEY + "_lastSaved", new Date().toISOString());
  } catch (e) {
    console.error("Failed to save state:", e);
    // If localStorage is full, try to clean up old data
    try {
      localStorage.removeItem(APP_KEY + "_backup");
      localStorage.setItem(APP_KEY, JSON.stringify(state.data));
    } catch (e2) {
      console.error("Critical: Cannot save data. Storage may be full.", e2);
      toast("Warning: Unable to save progress. Your browser storage may be full.", "error");
    }
  }
}

// Auto-save every 30 seconds as a backup
let autoSaveInterval;
function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    if (state.data) {
      saveState();
    }
  }, 30000); // Save every 30 seconds
}

// Save before page unload
function setupUnloadSave() {
  window.addEventListener("beforeunload", () => {
    if (state.data) {
      // Use synchronous storage for unload
      try {
        localStorage.setItem(APP_KEY, JSON.stringify(state.data));
      } catch (e) {
        console.error("Failed to save on unload:", e);
      }
    }
  });

  // Also save when page becomes hidden (tab switch, minimize, etc.)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.data) {
      saveState();
    }
  });
}

// ---------- Activity log ----------
function logActivity(entry) {
  const e = {
    id: uid("a"),
    at: new Date().toISOString(),
    ...entry
  };
  state.data.activity.unshift(e);
  state.data.activity = state.data.activity.slice(0, 40);
}

// ---------- Reward engine ----------
function recordDailySnapshot() {
  const d = todayStr();
  const existing = state.data.progressHistory.find(p => p.date === d);
  const p = {
    date: d,
    accountXp: state.data.profile.accountXp,
    level: state.data.profile.level,
    gold: state.data.profile.gold
  };
  if (existing) Object.assign(existing, p);
  else state.data.progressHistory.push(p);

  // Keep sane size
  state.data.progressHistory.sort((a,b) => a.date.localeCompare(b.date));
  if (state.data.progressHistory.length > 180) {
    state.data.progressHistory = state.data.progressHistory.slice(-180);
  }
}

function applyXpDelta(delta, meta = {}) {
  const profile = state.data.profile;

  if (delta === 0) return { gained: 0, levelled: false, multText: "" };

  // Only apply multipliers on gains
  let finalDelta = delta;
  let mult = 1;
  const daily = getDailyMultipliers();

  if (delta > 0) {
    const streakMult = getStreakMultiplier();
    mult *= streakMult;
    mult *= daily.xpMult;
    finalDelta = Math.round(delta * mult);
  }

  // Update level XP (never goes below 0; no level-down in this MVP)
  profile.levelXp = clamp(profile.levelXp + finalDelta, 0, Number.MAX_SAFE_INTEGER);

  // Level up loop
  let levelled = false;
  while (profile.levelXp >= xpForNextLevel(profile.level)) {
    profile.levelXp -= xpForNextLevel(profile.level);
    profile.level += 1;
    levelled = true;
  }

  // Account XP only increases on gains (used for gate unlocks; non-regressive)
  if (finalDelta > 0) {
    profile.accountXp += finalDelta;
  }

  if (delta > 0) {
    logActivity({
      type: meta.type || "xp",
      title: meta.title || "XP gained",
      detail: `${finalDelta} XP` + (mult > 1 ? ` (${mult.toFixed(2)}x)` : "")
    });
  } else {
    logActivity({
      type: meta.type || "xp",
      title: meta.title || "XP lost",
      detail: `${Math.abs(finalDelta)} XP`
    });
  }

  return { gained: finalDelta, levelled, multText: mult > 1 ? mult.toFixed(2) + "x" : "" };
}

function applyGoldDelta(delta, meta = {}) {
  const profile = state.data.profile;
  if (delta === 0) return { changed: 0, multText: "" };

  const daily = getDailyMultipliers();
  let finalDelta = delta;
  let mult = 1;
  if (delta > 0) {
    mult *= daily.goldMult;
    finalDelta = Math.round(delta * mult);
  }

  profile.gold = clamp(profile.gold + finalDelta, 0, Number.MAX_SAFE_INTEGER);

  logActivity({
    type: meta.type || "gold",
    title: meta.title || (finalDelta >= 0 ? "Gold gained" : "Gold spent"),
    detail: `${finalDelta >= 0 ? "+" : ""}${finalDelta} Gold`
  });

  return { changed: finalDelta, multText: mult > 1 ? mult.toFixed(2) + "x" : "" };
}

function grantRewards({ xp = 0, gold = 0, source = "Rewards", skipBossCheck = false } = {}) {
  const xpRes = applyXpDelta(xp, { type: "reward", title: source });
  const goldRes = applyGoldDelta(gold, { type: "reward", title: source });

  recordDailySnapshot();
  
  // Check boss requirements after rewards (unless we're already checking from a boss defeat)
  // This ensures gates unlock when Account XP is reached and defeat when requirements are met
  if (!skipBossCheck) {
    checkAllBossRequirements();
  }
  
  saveState();
  renderAll();

  // Toast summary
  const bits = [];
  if (xpRes.gained) bits.push(`${xpRes.gained > 0 ? "+" : ""}${xpRes.gained} XP`);
  if (goldRes.changed) bits.push(`${goldRes.changed > 0 ? "+" : ""}${goldRes.changed} Gold`);
  if (bits.length) toast(`${source}: ${bits.join(" • ")}`, xpRes.gained >= 0 ? "success" : "error");

  if (xpRes.levelled) toast(`Level up! Now level ${state.data.profile.level}`, "success");
}

// ---------- Daily tick + bonus ----------
function generateDailyBonusIfNeeded() {
  const p = state.data.profile;
  const today = todayStr();
  if (p.dailyBonus && p.dailyBonus.date === today) return;

  // Weighted RNG
  const r = Math.random();
  let b;
  if (r < 0.06) {
    b = { date: today, title: "2x XP Day", xpMult: 2, goldMult: 1, grantGoldOnce: 0 };
  } else if (r < 0.12) {
    b = { date: today, title: "Gold Rush (+20%)", xpMult: 1, goldMult: 1.2, grantGoldOnce: 0 };
  } else if (r < 0.16) {
    b = { date: today, title: "Lucky Draw (+50 Gold)", xpMult: 1, goldMult: 1, grantGoldOnce: 50 };
  } else {
    b = { date: today, title: "None", xpMult: 1, goldMult: 1, grantGoldOnce: 0 };
  }

  p.dailyBonus = b;

  // Grant one-time gold if any
  if (b.grantGoldOnce && b.grantGoldOnce > 0) {
    applyGoldDelta(b.grantGoldOnce, { type: "bonus", title: "Daily bonus" });
    toast(`Daily bonus: ${b.title}`, "success");
  }

  saveState();
}

function applyDailyLoginTick() {
  const p = state.data.profile;
  const today = todayStr();
  const last = p.lastLoginDate || today;

  const diff = daysBetween(last, today);
  if (diff <= 0) {
    p.lastLoginDate = today;
    return;
  }

  if (diff === 1) {
    p.currentStreak = (p.currentStreak || 0) + 1;
  } else {
    // Missed days: reset streak
    p.currentStreak = 1;
    // Gentle penalty: small XP loss (no multipliers, no level-down)
    const penalty = 10;
    applyXpDelta(-penalty, { type: "penalty", title: "Missed streak" });
    toast(`Missed ${diff - 1} day(s). Streak reset. -${penalty} XP`, "error");
  }

  p.bestStreak = Math.max(p.bestStreak || 0, p.currentStreak || 0);
  p.lastLoginDate = today;
  saveState();
  
  // Check boss requirements after streak update (may re-lock gates if streak drops)
  checkAllBossRequirements();
  
  renderAll();
}

// ---------- Rendering ----------

function fmt(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n || 0);
}

function renderAll() {
  renderDashboard();
  renderQuests();
  renderHabits();
  renderBosses();
  renderRewards();
  renderAwakening();
  renderActivity();
  renderCharts();
}

function animateValue(element, start, end, duration = 300) {
  if (!element) return;
  const startTime = performance.now();
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * easeOut);
    element.textContent = fmt(current);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = fmt(end);
    }
  };
  requestAnimationFrame(animate);
}

function updateValueWithAnimation(selector, oldValue, newValue) {
  const el = $(selector);
  if (!el) return;
  if (oldValue !== newValue && typeof oldValue === 'number' && typeof newValue === 'number') {
    el.classList.add('number-update');
    animateValue(el, oldValue, newValue);
    setTimeout(() => el.classList.remove('number-update'), 300);
  } else {
    el.textContent = typeof newValue === 'number' ? fmt(newValue) : newValue;
  }
}

function renderDashboard() {
  const p = state.data.profile;
  
  // Store old values for animation
  const oldValues = {
    level: parseInt($("#levelText").textContent) || p.level,
    levelXp: parseInt($("#levelXpText").textContent.replace(/,/g, '')) || p.levelXp,
    accountXp: parseInt($("#accountXpText").textContent.replace(/,/g, '')) || p.accountXp,
    gold: parseInt($("#goldText").textContent.replace(/,/g, '')) || p.gold
  };

  $("#usernameText").textContent = p.username;
  $("#rankText").textContent = p.rank;
  $("#streakText").textContent = `${p.currentStreak || 0} day(s)`;
  $("#multText").textContent = `${getStreakMultiplier().toFixed(2)}x`;
  $("#bonusText").textContent = p.dailyBonus?.date === todayStr() ? (p.dailyBonus.title || "None") : "None";

  // Animated value updates
  updateValueWithAnimation("#levelText", oldValues.level, p.level);
  updateValueWithAnimation("#levelXpText", oldValues.levelXp, p.levelXp);
  updateValueWithAnimation("#accountXpText", oldValues.accountXp, p.accountXp);
  updateValueWithAnimation("#goldText", oldValues.gold, p.gold);

  const doneQuests = state.data.quests.filter(q => q.status === "completed").length;
  const doneBosses = state.data.bosses.filter(b => b.status === "defeated").length;
  $("#questsDoneText").textContent = fmt(doneQuests);
  $("#bossDoneText").textContent = fmt(doneBosses);

  const next = xpForNextLevel(p.level);
  $("#xpToNextText").textContent = `${fmt(p.levelXp)} / ${fmt(next)}`;
  const pct = next > 0 ? Math.round((p.levelXp / next) * 100) : 0;
  const clampedPct = clamp(pct, 0, 100);
  $("#progressPct").textContent = `${clampedPct}%`;
  const progressBar = $("#xpProgress");
  const progressBg = progressBar?.parentElement;
  if (progressBar) progressBar.style.width = `${clampedPct}%`;
  if (progressBg) {
    progressBg.setAttribute("aria-valuenow", clampedPct.toString());
    progressBg.setAttribute("aria-label", `Experience progress: ${clampedPct}%`);
  }

  // next boss preview based on Account XP
  const nextBoss = [...state.data.bosses]
    .sort((a,b) => (a.unlockAccountXp || 0) - (b.unlockAccountXp || 0))
    .find(b => b.status === "locked" && (b.unlockAccountXp || 0) > p.accountXp);

  if (nextBoss) {
    $("#nextBossPreview").innerHTML = `Next gate: <span class="font-semibold text-red-200">${escapeHtml(nextBoss.name)}</span> at <span class="font-semibold">${fmt(nextBoss.unlockAccountXp)} Account XP</span>`;
  } else {
    $("#nextBossPreview").innerHTML = state.data.bosses.length ? `All gates are reachable or resolved.` : `Add your first gate/boss below to create milestones.`;
  }
}

function renderQuests() {
  const filter = $("#questFilter").value;
  const list = $("#questsList");
  const quests = state.data.quests
    .slice()
    .sort((a,b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));

  const filtered = quests.filter(q => filter === "all" ? true : q.status === filter);

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state text-sm text-white/60">No quests here yet. Add one above to get started! 🎯</div>`;
    return;
  }

  list.innerHTML = filtered.map((q, idx) => {
    const statusColor = q.status === "completed" ? "text-emerald-200" : q.status === "failed" ? "text-red-200" : "text-sky-200";
    const due = q.dueDate ? escapeHtml(q.dueDate) : "";
    const cat = q.category ? `<span class="chip">${escapeHtml(q.category)}</span>` : "";
    return `
      <div class="glass-2 p-4 flex items-start justify-between gap-3" style="animation-delay: ${idx * 0.05}s">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-semibold truncate">${escapeHtml(q.title)}</div>
            <span class="chip">${escapeHtml(q.difficulty || "easy")} • ${escapeHtml(String(q.duration || 15))}m</span>
            ${cat}
            <span class="chip ${statusColor}">${escapeHtml(q.status)}</span>
          </div>
          <div class="mt-2 text-sm text-white/70 flex flex-wrap gap-2">
            <span class="chip">XP: <span class="font-semibold text-sky-200">${fmt(q.xpReward || 0)}</span></span>
            <span class="chip">Gold: <span class="font-semibold text-amber-200">${fmt(q.goldReward || 0)}</span></span>
            ${due ? `<span class="chip">Due: <span class="font-semibold">${due}</span></span>` : ``}
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${q.status === "active" ? `
            <button data-action="quest-complete" data-id="${escapeHtml(q.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-400 text-black hover:brightness-105">Complete</button>
            <button data-action="quest-fail" data-id="${escapeHtml(q.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-red-400 text-black hover:brightness-105">Fail</button>
          ` : ``}
          <button data-action="quest-delete" data-id="${escapeHtml(q.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderHabits() {
  const list = $("#habitList");
  const today = todayStr();

  if (!state.data.habits.length) {
    list.innerHTML = `<div class="empty-state text-sm text-white/60">No habits yet. Add one to start building streaks! 🔥</div>`;
    renderHeatmap();
    return;
  }

  list.innerHTML = state.data.habits.map((h, idx) => {
    const done = !!(state.data.habitChecks[h.id]?.[today]);
    const freq = escapeHtml(h.frequency || "daily");
    const label = done ? "Done" : "Check in";
    return `
      <div class="glass-2 p-4 flex items-start justify-between gap-3" style="animation-delay: ${idx * 0.05}s">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-semibold truncate">${escapeHtml(h.name)}</div>
            <span class="chip">${freq}</span>
            <span class="chip">XP: <span class="font-semibold text-sky-200">${fmt(h.xpReward || 10)}</span></span>
            <span class="chip">Gold: <span class="font-semibold text-amber-200">${fmt(h.goldReward || 5)}</span></span>
          </div>
          <div class="mt-2 text-sm text-white/70">
            Current streak: <span class="font-semibold">${fmt(h.currentStreak || 0)}</span> • Best: <span class="font-semibold">${fmt(h.bestStreak || 0)}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button data-action="habit-check" data-id="${escapeHtml(h.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold ${done ? "bg-white/10 border border-white/10 text-white/70" : "bg-emerald-400 text-black hover:brightness-105"}">${label}</button>
          <button data-action="habit-delete" data-id="${escapeHtml(h.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  renderHeatmap();
}

function renderHeatmap() {
  const host = $("#habitHeat");
  const days = 21;
  const end = new Date();
  end.setHours(0,0,0,0);
  const cells = [];

  for (let i = 0; i < days; i++) {
    const dt = new Date(end.getTime() - (days - i - 1) * 86400000);
    const key = todayStr(dt);
    let count = 0;
    for (const h of state.data.habits) {
      if (state.data.habitChecks[h.id]?.[key]) count += 1;
    }
    const mark = Math.min(count, 3);
    cells.push({ key, count, mark });
  }

  host.innerHTML = cells.map(c => {
    return `<div class="heat-cell heat-${c.mark}" title="${escapeHtml(c.key)}: ${c.count} habit(s)"></div>`;
  }).join("");
}

function renderBosses() {
  const list = $("#bossList");
  const p = state.data.profile;
  const bosses = [...state.data.bosses].sort((a,b) => (a.unlockAccountXp || 0) - (b.unlockAccountXp || 0));

  if (!bosses.length) {
    list.innerHTML = `<div class="empty-state text-sm text-white/60">No gates/bosses yet. Add one to create milestones! ⚔️</div>`;
    return;
  }

  list.innerHTML = bosses.map((b, idx) => {
    const status = b.status || "locked";
    const canUnlock = status === "locked" && p.accountXp >= (b.unlockAccountXp || 0);
    const badgeColor = status === "defeated" ? "text-emerald-200" : status === "failed" ? "text-red-200" : status === "available" ? "text-sky-200" : "text-white/70";
    const tag = b.tag ? `<span class="chip">${escapeHtml(b.tag)}</span>` : "";
    const desc = b.description ? `<div class="mt-2 text-sm text-white/70">${escapeHtml(b.description)}</div>` : "";
    return `
      <div class="glass-2 p-4 flex items-start justify-between gap-3" style="animation-delay: ${idx * 0.05}s">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-semibold truncate">${escapeHtml(b.name)}</div>
            ${tag}
            <span class="chip">Unlock: <span class="font-semibold">${fmt(b.unlockAccountXp || 0)}</span> XP</span>
            <span class="chip">Reward: <span class="font-semibold text-sky-200">${fmt(b.xpReward || 0)} XP</span> • <span class="font-semibold text-amber-200">${fmt(b.goldReward || 0)} G</span></span>
            <span class="chip ${badgeColor}">${escapeHtml(status)}</span>
          </div>
          ${desc}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${canUnlock ? `<button data-action="boss-unlock" data-id="${escapeHtml(b.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15">Unlock</button>` : ``}
          ${status === "available" ? `
            <button data-action="boss-defeat" data-id="${escapeHtml(b.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-400 text-black hover:brightness-105">Defeat</button>
            <button data-action="boss-fail" data-id="${escapeHtml(b.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-red-400 text-black hover:brightness-105">Fail</button>
          ` : ``}
          <button data-action="boss-delete" data-id="${escapeHtml(b.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderRewards() {
  const list = $("#rewardList");
  const rewards = state.data.rewards;

  if (!rewards.length) {
    list.innerHTML = `<div class="empty-state text-sm text-white/60">No rewards yet. Add one to spend earned gold! 🎁</div>`;
    return;
  }

  list.innerHTML = rewards.map((r, idx) => {
    const cat = r.category ? `<span class="chip">${escapeHtml(r.category)}</span>` : "";
    return `
      <div class="glass-2 p-4 flex items-start justify-between gap-3" style="animation-delay: ${idx * 0.05}s">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-semibold truncate">${escapeHtml(r.name)}</div>
            ${cat}
            <span class="chip">Cost: <span class="font-semibold text-amber-200">${fmt(r.goldCost || 0)} G</span></span>
            <span class="chip">Claimed: <span class="font-semibold">${fmt(r.timesClaimed || 0)}×</span></span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button data-action="reward-claim" data-id="${escapeHtml(r.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-amber-300 text-black hover:brightness-105">Claim</button>
          <button data-action="reward-delete" data-id="${escapeHtml(r.id)}" class="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderAwakening() {
  $("#visionArea").value = state.data.vision || "";
  $("#antiArea").value = state.data.antivi || "";
}

function renderActivity() {
  const host = $("#activityList");
  const a = state.data.activity;
  if (!a.length) {
    host.innerHTML = `<div class="empty-state text-sm text-white/60">No activity yet. Complete a quest or habit to see your progress here! 📊</div>`;
    return;
  }

  host.innerHTML = a.slice(0, 12).map((e, idx) => {
    const at = new Date(e.at);
    const time = at.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `
      <div class="glass-2 p-3" style="animation-delay: ${idx * 0.03}s">
        <div class="text-xs text-white/60">${escapeHtml(time)}</div>
        <div class="text-sm font-semibold">${escapeHtml(e.title || "Activity")}</div>
        <div class="text-sm text-white/70">${escapeHtml(e.detail || "")}</div>
      </div>
    `;
  }).join("");
}

function renderCharts() {
  if (!window.Chart) return;

  // Ensure at least one point today
  if (!state.data.progressHistory.length) recordDailySnapshot();

  const hist = state.data.progressHistory.slice(-14);
  const labels = hist.map(p => p.date.slice(5));
  const xpData = hist.map(p => p.accountXp || 0);
  const levelData = hist.map(p => p.level || 1);

  // XP chart
  try {
    if (xpChartInstance) xpChartInstance.destroy();
    xpChartInstance = new Chart($("#xpChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Account XP",
            data: xpData,
            borderColor: "#56cffe",
            backgroundColor: "rgba(86, 207, 254, 0.18)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: "Level",
            data: levelData,
            borderColor: "#33ce91",
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 2,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "rgba(233,231,255,0.85)", font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: "rgba(233,231,255,0.72)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { ticks: { color: "rgba(86,207,254,0.85)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y1: { position: "right", ticks: { color: "rgba(51,206,145,0.85)" }, grid: { drawOnChartArea: false } }
        }
      }
    });
  } catch (e) {
    console.warn("XP chart error", e);
  }

  // Quest breakdown chart
  const completed = state.data.quests.filter(q => q.status === "completed").length;
  const failed = state.data.quests.filter(q => q.status === "failed").length;
  const active = state.data.quests.filter(q => q.status === "active").length;

  try {
    if (questChartInstance) questChartInstance.destroy();
    questChartInstance = new Chart($("#questChart"), {
      type: "bar",
      data: {
        labels: ["Completed", "Failed", "Active"],
        datasets: [{
          label: "Quests",
          data: [completed, failed, active],
          backgroundColor: ["rgba(51,206,145,0.8)", "rgba(255,59,79,0.8)", "rgba(86,207,254,0.8)"],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "rgba(233,231,255,0.72)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { ticks: { color: "rgba(233,231,255,0.72)", precision: 0 }, grid: { color: "rgba(255,255,255,0.06)" }, beginAtZero: true }
        }
      }
    });
  } catch (e) {
    console.warn("Quest chart error", e);
  }

  // Habit streak chart (top 6)
  const topHabits = state.data.habits
    .slice()
    .sort((a,b) => (b.currentStreak || 0) - (a.currentStreak || 0))
    .slice(0, 6);

  try {
    if (habitChartInstance) habitChartInstance.destroy();
    habitChartInstance = new Chart($("#habitChart"), {
      type: "bar",
      data: {
        labels: topHabits.map(h => h.name.length > 14 ? h.name.slice(0, 14) + "…" : h.name),
        datasets: [
          {
            label: "Current",
            data: topHabits.map(h => h.currentStreak || 0),
            backgroundColor: "rgba(86,207,254,0.8)",
            borderRadius: 8
          },
          {
            label: "Best",
            data: topHabits.map(h => h.bestStreak || 0),
            backgroundColor: "rgba(51,206,145,0.8)",
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "rgba(233,231,255,0.85)", font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: "rgba(233,231,255,0.72)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { ticks: { color: "rgba(233,231,255,0.72)", precision: 0 }, grid: { color: "rgba(255,255,255,0.06)" }, beginAtZero: true }
        }
      }
    });
  } catch (e) {
    console.warn("Habit chart error", e);
  }
}

// ---------- Actions ----------

function openSettings() {
  $("#usernameInput").value = state.data.profile.username || "";
  $("#emailInput").value = state.data.profile.email || "";
  $("#settingsBackdrop").classList.add("show");
  document.body.classList.add('modal-open');
  const closeBtn = document.getElementById('closeSettings');
  // Focus the first input for quick accessibility
  const firstInput = document.querySelector('#settingsBackdrop .modal input, #settingsBackdrop .modal textarea');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 40);
  } else if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 40);
  }
  // Ensure modal scrolls to top on open so header and all sections are seen
  const modalEl = document.querySelector('#settingsBackdrop .modal');
  if (modalEl) modalEl.scrollTop = 0;
}

function closeSettings() {
  $("#settingsBackdrop").classList.remove("show");
  document.body.classList.remove('modal-open');
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "solo-leveling-mvp",
    version: state.data.version,
    data: state.data
  };
  const str = JSON.stringify(payload, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "solo_leveling_mvp_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("Exported progress.", "success");
}

function importDataFromFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(String(e.target.result || ""));
      const incoming = obj.data || obj;
      if (!incoming || !incoming.profile) throw new Error("Invalid export file");

      // Merge with defaults so missing fields don’t break UI
      const merged = { ...defaultState(), ...incoming };
      merged.profile = { ...defaultState().profile, ...incoming.profile };
      merged.settings = { ...defaultState().settings, ...incoming.settings };
      merged.activity = Array.isArray(incoming.activity) ? incoming.activity : [];

      state.data = merged;
      saveState();
      toast("Import successful.", "success");
      renderAll();
    } catch (err) {
      toast("Import failed: " + (err?.message || String(err)), "error");
    }
  };
  reader.readAsText(file);
}

function setDueDateDefault() {
  const el = $("#questForm").elements.namedItem("due");
  const d = new Date();
  d.setDate(d.getDate() + 1);
  el.value = todayStr(d);
}

// ---------- Event wiring ----------

function wireEvents() {
  // Header actions
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#closeSettings").addEventListener("click", closeSettings);
  $("#settingsBackdrop").addEventListener("click", (e) => { if (e.target.id === "settingsBackdrop") closeSettings(); });

  // Export / import buttons
  const importClick = () => $("#importFile").click();
  $("#exportBtn").addEventListener("click", exportData);
  $("#exportBtn2").addEventListener("click", exportData);
  $("#exportBtn3").addEventListener("click", exportData);
  $("#exportBtn4").addEventListener("click", exportData);

  $("#importBtn").addEventListener("click", importClick);
  $("#importBtn2").addEventListener("click", importClick);
  $("#importBtn3").addEventListener("click", importClick);
  $("#importBtn4").addEventListener("click", importClick);

  $("#importFile").addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    importDataFromFile(file);
    ev.target.value = "";
  });


  // Settings save
  $("#saveSettings").addEventListener("click", () => {
    state.data.profile.username = $("#usernameInput").value.trim() || "Player";
    state.data.profile.email = $("#emailInput").value.trim() || "";
    saveState();
    renderAll();
    toast("Settings saved.", "success");
  });

  // Hard reset
  $("#hardReset").addEventListener("click", () => {
    if (!confirm("Reset everything? Export first if needed.")) return;
    state.data = defaultState();
    // Add default content on hard reset
    state.data.quests = getDefaultQuests();
    state.data.bosses = getDefaultBosses();
    state.data.rewards = getDefaultRewards();
    saveState();
    renderAll();
    toast("Reset complete. Default quests, gates, and rewards have been added.", "success");
  });

  // Mobile quick action buttons for parity with desktop
  const quickQuestBtn = document.getElementById('quickQuestBtn');
  if (quickQuestBtn) quickQuestBtn.addEventListener('click', () => {
    const el = document.querySelector('#questForm input[name="title"]');
    if (el) { el.focus(); window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' }); }
  });
  const quickHabitBtn = document.getElementById('quickHabitBtn');
  if (quickHabitBtn) quickHabitBtn.addEventListener('click', () => {
    const el = document.querySelector('#habitForm input[name="name"]');
    if (el) { el.focus(); window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' }); }
  });
  const quickBossBtn = document.getElementById('quickBossBtn');
  if (quickBossBtn) quickBossBtn.addEventListener('click', () => {
    const el = document.querySelector('#bossForm input[name="name"]');
    if (el) { el.focus(); window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' }); }
  });
  const quickRewardBtn = document.getElementById('quickRewardBtn');
  if (quickRewardBtn) quickRewardBtn.addEventListener('click', () => {
    const el = document.querySelector('#rewardForm input[name="name"]');
    if (el) { el.focus(); window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' }); }
  });

  // Dashboard reset
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("This will reset all progress. Export first?")) return;
    state.data = defaultState();
    // Add default content on reset
    state.data.quests = getDefaultQuests();
    state.data.bosses = getDefaultBosses();
    state.data.rewards = getDefaultRewards();
    saveState();
    setDueDateDefault();
    renderAll();
    toast("All progress reset. Default quests, gates, and rewards have been added.", "success");
  });

  // Demo data
  $("#demoBtn").addEventListener("click", () => {
    if (!confirm("Load demo data? This will overwrite current data.")) return;
    const s = defaultState();
    s.profile.username = "Jin-Woo";
    s.profile.currentStreak = 6;
    s.profile.bestStreak = 18;
    s.profile.level = 4;
    s.profile.levelXp = 40;
    s.profile.accountXp = computeAccountXpFromLevel(s.profile.level, s.profile.levelXp);
    s.profile.gold = 120;
    s.profile.rank = getRank(s.profile.level);
    s.quests = [
      { id: uid("q"), title: "Deep Work: 45 minutes", difficulty: "medium", duration: 60, dueDate: todayStr(new Date(Date.now()+86400000)), category: "Focus", status: "active", xpReward: 50, goldReward: 25 },
      { id: uid("q"), title: "Gym session", difficulty: "hard", duration: 120, dueDate: todayStr(new Date(Date.now()+2*86400000)), category: "Health", status: "active", xpReward: 150, goldReward: 75 },
      { id: uid("q"), title: "Plan the week", difficulty: "easy", duration: 30, dueDate: todayStr(), category: "Planning", status: "completed", xpReward: 15, goldReward: 8 }
    ];
    s.habits = [
      { id: uid("h"), name: "Read 10 pages", frequency: "daily", xpReward: 12, goldReward: 6, currentStreak: 4, bestStreak: 12, lastCompletedDate: todayStr() },
      { id: uid("h"), name: "Meditate 5 minutes", frequency: "daily", xpReward: 10, goldReward: 5, currentStreak: 2, bestStreak: 8, lastCompletedDate: todayStr(new Date(Date.now()-86400000)) }
    ];
    s.habitChecks = {};

    // seed some checks
    const t = new Date(); t.setHours(0,0,0,0);
    for (const h of s.habits) {
      s.habitChecks[h.id] = {};
      for (let i=0;i<10;i++) {
        const d = new Date(t.getTime() - i*86400000);
        if (Math.random() < 0.55) s.habitChecks[h.id][todayStr(d)] = true;
      }
    }

    s.bosses = [
      { id: uid("b"), name: "Gate: Procrastination", unlockAccountXp: 250, xpReward: 120, goldReward: 60, tag: "Mindset", description: "Win by finishing 2 active quests today.", status: "locked" },
      { id: uid("b"), name: "Gate: Weak Body", unlockAccountXp: 600, xpReward: 240, goldReward: 120, tag: "Health", description: "Win by completing a hard quest (2h+) this week.", status: "locked" }
    ];

    s.rewards = [
      { id: uid("r"), name: "Coffee", goldCost: 20, category: "Treat", timesClaimed: 1 },
      { id: uid("r"), name: "30 min gaming", goldCost: 40, category: "Fun", timesClaimed: 0 }
    ];

    s.vision = "A disciplined hunter who takes action daily.";
    s.antivi = "Staying stuck, losing opportunities, and regretting wasted time.";

    // snapshot
    s.progressHistory = [];
    state.data = s;
    generateDailyBonusIfNeeded();
    recordDailySnapshot();
    saveState();
    setDueDateDefault();
    renderAll();
    toast("Demo loaded.", "success");
  });

  // Forms
  $("#questForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const f = e.target;
    const title = f.title.value.trim();
    const difficulty = f.difficulty.value;
    const duration = Number(f.duration.value);
    const dueDate = f.due.value;
    const category = f.category.value.trim();
    if (!title) return;

    const xpBase = (DIFFICULTY_XP[difficulty] || 10) * (DURATION_MULT[String(duration)] || 1);
    const xpReward = Math.round(xpBase);
    const goldReward = Math.round(xpReward * 0.5);

    state.data.quests.push({
      id: uid("q"),
      title,
      difficulty,
      duration,
      dueDate,
      category,
      status: "active",
      xpReward,
      goldReward,
      createdAt: new Date().toISOString(),
      completedAt: null
    });

    logActivity({ type: "quest", title: "Quest added", detail: title });
    saveState();
    renderAll();
    toast("Quest added.", "success");
    f.reset();
    setDueDateDefault();
  });

  $("#habitForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const f = e.target;
    const name = f.name.value.trim();
    const frequency = f.frequency.value;
    const xp = clamp(Number(f.xp.value || 10), 1, 10000);
    const gold = clamp(Number(f.gold.value || 5), 0, 10000);
    if (!name) return;

    state.data.habits.push({
      id: uid("h"),
      name,
      frequency,
      xpReward: xp,
      goldReward: gold,
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    });

    saveState();
    renderAll();
    toast("Habit added.", "success");
    f.reset();
  });

  $("#bossForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const f = e.target;
    const name = f.name.value.trim();
    const unlockAccountXp = clamp(Number(f.unlock.value), 0, 1e12);
    const rewardXp = clamp(Number(f.rewardXp.value), 0, 1e12);
    const rewardGold = clamp(Number(f.rewardGold.value), 0, 1e12);
    const tag = f.tag.value.trim();
    const description = f.desc.value.trim();

    if (!name) return;
    state.data.bosses.push({
      id: uid("b"),
      name,
      unlockAccountXp,
      xpReward: rewardXp,
      goldReward: rewardGold,
      tag,
      description,
      status: "locked",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    });

    saveState();
    renderAll();
    toast("Gate/boss added.", "success");
    f.reset();
  });

  $("#rewardForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const f = e.target;
    const name = f.name.value.trim();
    const cost = clamp(Number(f.cost.value), 1, 1e12);
    const category = f.category.value.trim();
    if (!name) return;

    state.data.rewards.push({
      id: uid("r"),
      name,
      goldCost: cost,
      category,
      timesClaimed: 0,
      createdAt: new Date().toISOString()
    });

    saveState();
    renderAll();
    toast("Reward added.", "success");
    f.reset();
  });

  // Save awakening
  $("#saveVision").addEventListener("click", () => {
    state.data.vision = $("#visionArea").value.trim();
    saveState();
    toast("Vision saved.", "success");
  });

  $("#saveAnti").addEventListener("click", () => {
    state.data.antivi = $("#antiArea").value.trim();
    saveState();
    toast("Anti-vision saved.", "success");
  });

  // Clear completed quests
  $("#clearCompletedQuests").addEventListener("click", () => {
    const before = state.data.quests.length;
    state.data.quests = state.data.quests.filter(q => q.status !== "completed");
    const removed = before - state.data.quests.length;
    saveState();
    renderAll();
    toast(removed ? `Cleared ${removed} completed quest(s).` : "No completed quests to clear.", "success");
  });

  // Clear activity
  $("#clearActivity").addEventListener("click", () => {
    state.data.activity = [];
    saveState();
    renderAll();
    toast("Activity cleared.", "success");
  });

  // List action delegation
  document.body.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "quest-complete") return handleQuestComplete(id);
    if (action === "quest-fail") return handleQuestFail(id);
    if (action === "quest-delete") return handleQuestDelete(id);

    if (action === "habit-check") return handleHabitCheck(id);
    if (action === "habit-delete") return handleHabitDelete(id);

    if (action === "boss-unlock") return handleBossUnlock(id);
    if (action === "boss-defeat") return handleBossDefeat(id);
    if (action === "boss-fail") return handleBossFail(id);
    if (action === "boss-delete") return handleBossDelete(id);

    if (action === "reward-claim") return handleRewardClaim(id);
    if (action === "reward-delete") return handleRewardDelete(id);
  });
}

// ---------- Handlers ----------

function handleQuestComplete(id) {
  const q = state.data.quests.find(x => x.id === id);
  if (!q || q.status !== "active") return;
  q.status = "completed";
  q.completedAt = new Date().toISOString();

  // Small chance for bonus gold
  const crit = Math.random() < 0.08;
  const bonusGold = crit ? Math.round((q.goldReward || 0) * 0.5) : 0;

  grantRewards({ xp: q.xpReward || 0, gold: (q.goldReward || 0) + bonusGold, source: `Quest completed: ${q.title}` });
  if (bonusGold) toast(`Bonus gold! +${bonusGold}`, "success");

  // Note: grantRewards already calls checkAllBossRequirements, so we don't need to call it again
  // But we still need to save/render for the quest completion itself
  saveState();
  renderAll();
}

function handleQuestFail(id) {
  const q = state.data.quests.find(x => x.id === id);
  if (!q || q.status !== "active") return;
  q.status = "failed";
  q.completedAt = new Date().toISOString();

  const xpLoss = Math.round((q.xpReward || 0) * 0.5);
  grantRewards({ xp: -xpLoss, gold: 0, source: `Quest failed: ${q.title}` });

  saveState();
  renderAll();
}

function handleQuestDelete(id) {
  const q = state.data.quests.find(x => x.id === id);
  if (!q) return;
  if (!confirm(`Delete quest "${q.title}"?`)) return;
  state.data.quests = state.data.quests.filter(x => x.id !== id);
  saveState();
  renderAll();
  toast("Quest deleted.", "success");
}

function handleHabitCheck(id) {
  const h = state.data.habits.find(x => x.id === id);
  if (!h) return;

  const today = todayStr();
  if (!state.data.habitChecks[id]) state.data.habitChecks[id] = {};
  if (state.data.habitChecks[id][today]) {
    return toast("Already checked in today.", "error");
  }

  // Mark completion
  state.data.habitChecks[id][today] = true;

  // Streak rules
  const yesterday = todayStr(new Date(Date.now() - 86400000));
  const last = h.lastCompletedDate;
  h.currentStreak = (last === yesterday) ? (h.currentStreak || 0) + 1 : 1;
  h.bestStreak = Math.max(h.bestStreak || 0, h.currentStreak || 0);
  h.lastCompletedDate = today;

  // Random crit (double rewards)
  const isCrit = Math.random() < 0.15;
  const xp = (h.xpReward || 10) * (isCrit ? 2 : 1);
  const gold = (h.goldReward || 5) * (isCrit ? 2 : 1);

  grantRewards({ xp, gold, source: `Habit: ${h.name}` });
  if (isCrit) toast("CRITICAL HIT! Double rewards.", "success");

  saveState();
  
  // Check boss requirements after habit check (might affect streak)
  checkAllBossRequirements();
  
  renderAll();
}

function handleHabitDelete(id) {
  const h = state.data.habits.find(x => x.id === id);
  if (!h) return;
  if (!confirm(`Delete habit "${h.name}"?`)) return;
  state.data.habits = state.data.habits.filter(x => x.id !== id);
  delete state.data.habitChecks[id];
  saveState();
  renderAll();
  toast("Habit deleted.", "success");
}

function handleBossUnlock(id) {
  const b = state.data.bosses.find(x => x.id === id);
  if (!b || b.status !== "locked") return;
  if (state.data.profile.accountXp < (b.unlockAccountXp || 0)) {
    return toast("Not enough Account XP to unlock.", "error");
  }
  b.status = "available";
  b.startedAt = new Date().toISOString();
  saveState();
  
  // Check if boss requirements are already met when unlocking
  checkAllBossRequirements();
  
  renderAll();
  toast("Gate unlocked. Battle is available.", "success");
}

function checkBossRequirements(boss) {
  if (!boss || boss.status !== "available" || !boss.description) return false;
  
  const desc = boss.description.toLowerCase();
  const today = todayStr();
  const profile = state.data.profile;
  
  // Check "completing X quests in a single day"
  const questsTodayMatch = desc.match(/completing (\d+) quests? in a single day/);
  if (questsTodayMatch) {
    const requiredCount = parseInt(questsTodayMatch[1]);
    const completedToday = state.data.quests.filter(q => 
      q.status === "completed" && 
      q.completedAt && 
      todayStr(new Date(q.completedAt)) === today
    ).length;
    if (completedToday >= requiredCount) {
      return true;
    }
  }
  
  // Check "maintaining a X-day streak"
  const streakMatch = desc.match(/maintaining a (\d+)[- ]day streak/);
  if (streakMatch) {
    const requiredStreak = parseInt(streakMatch[1]);
    if (profile.currentStreak >= requiredStreak) return true;
  }
  
  // Check "completing a medium or hard quest without failing"
  if (desc.includes("completing a medium or hard quest") && desc.includes("without failing")) {
    const hasCompletedMediumOrHard = state.data.quests.some(q => 
      q.status === "completed" && 
      (q.difficulty === "medium" || q.difficulty === "hard") &&
      q.completedAt
    );
    const hasFailedQuest = state.data.quests.some(q => q.status === "failed");
    if (hasCompletedMediumOrHard && !hasFailedQuest) return true;
  }
  
  // Check "reaching level X"
  const levelMatch = desc.match(/reaching level (\d+)/);
  if (levelMatch) {
    const requiredLevel = parseInt(levelMatch[1]);
    if (profile.level >= requiredLevel) return true;
  }
  
  // Check "completing X quests today" (alternative phrasing)
  const questsTodayAltMatch = desc.match(/completing (\d+) quests? today/);
  if (questsTodayAltMatch) {
    const requiredCount = parseInt(questsTodayAltMatch[1]);
    const completedToday = state.data.quests.filter(q => 
      q.status === "completed" && 
      q.completedAt && 
      todayStr(new Date(q.completedAt)) === today
    ).length;
    if (completedToday >= requiredCount) return true;
  }
  
  // Check "win by finishing X active quests today"
  const finishQuestsMatch = desc.match(/finishing (\d+) active quests? today/);
  if (finishQuestsMatch) {
    const requiredCount = parseInt(finishQuestsMatch[1]);
    const completedToday = state.data.quests.filter(q => 
      q.status === "completed" && 
      q.completedAt && 
      todayStr(new Date(q.completedAt)) === today
    ).length;
    if (completedToday >= requiredCount) return true;
  }
  
  return false;
}

function shouldGateReLock(boss) {
  // Only check gates that have been defeated and can re-lock
  if (!boss || boss.status !== "defeated" || !boss.description) return false;
  
  const desc = boss.description.toLowerCase();
  const today = todayStr();
  const profile = state.data.profile;
  
  // Check "completing X quests in a single day" - re-lock if not meeting daily requirement
  const questsTodayMatch = desc.match(/completing (\d+) quests? in a single day/);
  if (questsTodayMatch) {
    const requiredCount = parseInt(questsTodayMatch[1]);
    const completedToday = state.data.quests.filter(q => 
      q.status === "completed" && 
      q.completedAt && 
      todayStr(new Date(q.completedAt)) === today
    ).length;
    // Re-lock if today's quests are less than required
    if (completedToday < requiredCount) return true;
  }
  
  // Check "maintaining a X-day streak" - re-lock if streak drops below requirement
  const streakMatch = desc.match(/maintaining a (\d+)[- ]day streak/);
  if (streakMatch) {
    const requiredStreak = parseInt(streakMatch[1]);
    // Re-lock if current streak is below required
    if (profile.currentStreak < requiredStreak) return true;
  }
  
  // For one-time achievements (level-based, quest completion without failing), don't re-lock
  if (desc.includes("reaching level") || desc.includes("completing a medium or hard quest")) {
    return false; // These are one-time achievements
  }
  
  return false;
}

function checkAllBossRequirements() {
  const profile = state.data.profile;
  let anyDefeated = false;
  let anyReLocked = false;
  
  // First, auto-unlock any gates that meet Account XP requirements
  for (const boss of state.data.bosses) {
    if (boss.status === "locked" && profile.accountXp >= (boss.unlockAccountXp || 0)) {
      boss.status = "available";
      boss.startedAt = new Date().toISOString();
      toast(`🔓 Gate unlocked: ${boss.name}!`, "success");
    }
  }
  
  // Check if any defeated gates should re-lock (user performance dropped)
  for (const boss of state.data.bosses) {
    if (boss.status === "defeated" && shouldGateReLock(boss)) {
      boss.status = "available";
      boss.completedAt = null;
      toast(`⚠️ ${boss.name} has re-emerged! Maintain your performance to keep it defeated.`, "error");
      anyReLocked = true;
    }
  }
  
  // Then check requirements for all available bosses
  const availableBosses = state.data.bosses.filter(b => b.status === "available");
  for (const boss of availableBosses) {
    if (checkBossRequirements(boss)) {
      boss.status = "defeated";
      boss.completedAt = new Date().toISOString();
      // Use skipBossCheck to prevent recursive calls
      grantRewards({ 
        xp: boss.xpReward || 0, 
        gold: boss.goldReward || 0, 
        source: `Boss defeated: ${boss.name}`,
        skipBossCheck: true
      });
      toast(`🎉 Gate defeated: ${boss.name}!`, "success");
      anyDefeated = true;
    }
  }
  return anyDefeated || anyReLocked;
}

function handleBossDefeat(id) {
  const b = state.data.bosses.find(x => x.id === id);
  if (!b || b.status !== "available") return;
  b.status = "defeated";
  b.completedAt = new Date().toISOString();
  grantRewards({ xp: b.xpReward || 0, gold: b.goldReward || 0, source: `Boss defeated: ${b.name}` });
  saveState();
  renderAll();
}

function handleBossFail(id) {
  const b = state.data.bosses.find(x => x.id === id);
  if (!b || b.status !== "available") return;
  b.status = "failed";
  b.completedAt = new Date().toISOString();

  const xpLoss = Math.round((b.xpReward || 0) * 0.5);
  const goldLoss = Math.round((b.goldReward || 0) * 0.5);
  grantRewards({ xp: -xpLoss, gold: -goldLoss, source: `Boss failed: ${b.name}` });

  saveState();
  renderAll();
}

function handleBossDelete(id) {
  const b = state.data.bosses.find(x => x.id === id);
  if (!b) return;
  if (!confirm(`Delete gate/boss "${b.name}"?`)) return;
  state.data.bosses = state.data.bosses.filter(x => x.id !== id);
  saveState();
  renderAll();
  toast("Boss deleted.", "success");
}

function handleRewardClaim(id) {
  const r = state.data.rewards.find(x => x.id === id);
  if (!r) return;
  const cost = r.goldCost || 0;
  if (state.data.profile.gold < cost) return toast("Not enough gold.", "error");

  // Spend gold (no multipliers)
  applyGoldDelta(-cost, { type: "spend", title: `Reward claimed: ${r.name}` });
  r.timesClaimed = (r.timesClaimed || 0) + 1;
  saveState();
  renderAll();
  toast(`Reward claimed: ${r.name}`, "success");
}

function handleRewardDelete(id) {
  const r = state.data.rewards.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`Delete reward "${r.name}"?`)) return;
  state.data.rewards = state.data.rewards.filter(x => x.id !== id);
  saveState();
  renderAll();
  toast("Reward deleted.", "success");
}

// ---------- Init ----------

function init() {
  loadState();
  setDueDateDefault();
  applyDailyLoginTick();
  generateDailyBonusIfNeeded();
  recordDailySnapshot();
  saveState();

  // Start auto-save and unload handlers
  startAutoSave();
  setupUnloadSave();

  wireEvents();
  renderAll();

  // Ensure charts draw after layout
  setTimeout(renderCharts, 50);

  // Show data persistence info on first visit
  const firstVisit = !localStorage.getItem(APP_KEY);
  if (!firstVisit) {
    const lastSaved = localStorage.getItem(APP_KEY + "_lastSaved");
    if (lastSaved) {
      const savedDate = new Date(lastSaved);
      const now = new Date();
      const daysDiff = Math.floor((now - savedDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 0) {
        console.log(`Your data was last saved ${daysDiff} day(s) ago. Data persists in your browser.`);
      }
    }
  }

  // Register service worker for PWA & offline support
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('/service-worker.js').then(reg => {
        console.log('Service worker registered.', reg.scope);
        // Notify when a new service worker is found
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  toast('Update available — reload to apply the latest changes.', 'info');
                }
              }
            });
          });
        }
      }).catch(e => console.warn('Service worker registration failed:', e));
    } catch (e) {
      console.warn('Service worker registration error:', e);
    }
  }

  // Capture the PWA beforeinstallprompt event so we can trigger it from UI
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) {
      btn.classList.remove('hidden');
      btn.classList.add('install-visible');
    }
  });

  // Install button handling
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome) {
        console.log('User choice for PWA install:', choice.outcome);
      }
      deferredPrompt = null;
      installBtn.classList.remove('install-visible');
      installBtn.classList.add('hidden');
    });
  }

  // Hide install button and show success toast after app is installed
  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('installBtn');
    if (btn) btn.classList.add('hidden');
    toast('App installed successfully. Enjoy offline access!', 'success');
  });
}

window.addEventListener("load", init);
