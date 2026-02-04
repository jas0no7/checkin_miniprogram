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

function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

function normalizeCalendar(res) {
  let dates = [];
  if (Array.isArray(res)) {
    dates = res;
  } else if (res && Array.isArray(res.dates)) {
    dates = res.dates;
  } else if (res && Array.isArray(res.checkins)) {
    dates = res.checkins.map((item) => item.checkin_date || item.date || item);
  } else if (res && Array.isArray(res.data)) {
    dates = res.data;
  }

  const set = new Set();
  dates.forEach((item) => {
    if (!item) return;
    const value = typeof item === 'string' ? item : item.checkin_date || item.date;
    if (!value) return;
    set.add(value.slice(0, 10));
  });

  return set;
}

function buildCalendar(year, month, checkedSet) {
  const firstDay = new Date(year, month - 1, 1);
  const weekIndex = (firstDay.getDay() + 6) % 7; // Monday start
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < weekIndex; i += 1) {
    cells.push({ day: '', isEmpty: true, checked: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    cells.push({
      day,
      dateStr,
      isEmpty: false,
      checked: checkedSet.has(dateStr)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: '', isEmpty: true, checked: false });
  }

  return cells;
}

Page({
  data: {
    habits: [],
    habitNames: [],
    habitIndex: 0,
    currentHabitId: null,
    year: 0,
    month: 0,
    monthLabel: '',
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    days: []
  },
  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.updateMonthLabel();
  },
  onShow() {
    this.loadHabits();
  },
  updateMonthLabel() {
    const { year, month } = this.data;
    this.setData({ monthLabel: `${year}-${pad(month)}` });
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
        this.refreshCalendar();
      })
      .catch(() => {
        this.setData({ habits: [], habitNames: [], currentHabitId: null, days: [] });
      });
  },
  onHabitChange(e) {
    const habitIndex = Number(e.detail.value || 0);
    const habit = this.data.habits[habitIndex];
    const currentHabitId = habit ? habit.id : null;
    store.setCurrentHabitId(currentHabitId);
    this.setData({ habitIndex, currentHabitId });
    this.refreshCalendar();
  },
  refreshCalendar() {
    const { year, month, currentHabitId } = this.data;
    this.updateMonthLabel();
    if (!currentHabitId) {
      this.setData({ days: buildCalendar(year, month, new Set()) });
      return;
    }

    const monthStr = `${year}-${pad(month)}`;
    api.calendar
      .month(monthStr)
      .then((res) => {
        const checkedSet = normalizeCalendar(res);
        const days = buildCalendar(year, month, checkedSet);
        this.setData({ days });
      })
      .catch(() => {
        this.setData({ days: buildCalendar(year, month, new Set()) });
      });
  },
  onPrevMonth() {
    let { year, month } = this.data;
    month -= 1;
    if (month <= 0) {
      month = 12;
      year -= 1;
    }
    this.setData({ year, month });
    this.refreshCalendar();
  },
  onNextMonth() {
    let { year, month } = this.data;
    month += 1;
    if (month >= 13) {
      month = 1;
      year += 1;
    }
    this.setData({ year, month });
    this.refreshCalendar();
  }
});
