const api = require('../../api/index');
const store = require('../../utils/store');

function normalizeHabits(res) {
  if (Array.isArray(res)) {
    return res;
  }
  if (res && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

function normalizeStats(res) {
  let streakValue = 0;
  let totalValue = 0;
  if (res) {
    if (res.streak !== undefined && res.streak !== null) {
      streakValue = res.streak;
    } else if (res.current_streak !== undefined && res.current_streak !== null) {
      streakValue = res.current_streak;
    }

    if (res.total !== undefined && res.total !== null) {
      totalValue = res.total;
    } else if (res.total_days !== undefined && res.total_days !== null) {
      totalValue = res.total_days;
    }
  }

  const streak = Number(streakValue) || 0;
  const total = Number(totalValue) || 0;
  const last = (res && (res.last_checkin_date || res.last_date)) || '-';

  return {
    streak: Number.isNaN(streak) ? 0 : streak,
    total: Number.isNaN(total) ? 0 : total,
    last_checkin_date: last || '-'
  };
}

Page({
  data: {
    habits: [],
    habitNames: [],
    habitIndex: 0,
    currentHabitId: null,
    stats: {
      streak: 0,
      total: 0,
      last_checkin_date: '-'
    }
  },
  onShow() {
    this.loadHabits();
  },
  loadHabits() {
    api.habits
      .list()
      .then((res) => {
        const habits = normalizeHabits(res);
        const habitNames = habits.map((item) => item.title);
        const storedId = store.getCurrentHabitId();
        let habitIndex = 0;
        let currentHabitId = null;

        if (habits.length > 0) {
          if (storedId) {
            const foundIndex = habits.findIndex((item) => `${item.id}` === `${storedId}`);
            if (foundIndex >= 0) {
              habitIndex = foundIndex;
            }
          }
          currentHabitId = habits[habitIndex].id;
          store.setCurrentHabitId(currentHabitId);
        } else {
          store.setCurrentHabitId(null);
        }

        this.setData({ habits, habitNames, habitIndex, currentHabitId });
        this.loadStats();
      })
      .catch(() => {
        this.setData({ habits: [], habitNames: [], currentHabitId: null, stats: normalizeStats({}) });
      });
  },
  onHabitChange(e) {
    const habitIndex = Number(e.detail.value || 0);
    const habit = this.data.habits[habitIndex];
    const currentHabitId = habit ? habit.id : null;
    store.setCurrentHabitId(currentHabitId);
    this.setData({ habitIndex, currentHabitId });
    this.loadStats();
  },
  loadStats() {
    const { currentHabitId } = this.data;
    if (!currentHabitId) {
      this.setData({ stats: normalizeStats({}) });
      return;
    }

    api.stats
      .get(currentHabitId)
      .then((res) => {
        this.setData({ stats: normalizeStats(res || {}) });
      })
      .catch(() => {
        this.setData({ stats: normalizeStats({}) });
      });
  }
});
