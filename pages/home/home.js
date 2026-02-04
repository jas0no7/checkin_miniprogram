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

function parseTodayChecked(res) {
  if (res === true) return true;
  if (!res) return false;
  if (Array.isArray(res)) return res.length > 0;
  if (typeof res === 'object') {
    if (res.checked !== undefined) return !!res.checked;
    if (res.exists !== undefined) return !!res.exists;
    if (res.id !== undefined) return true;
    if (res.checkin_date) return true;
  }
  return false;
}

Page({
  data: {
    habits: [],
    habitNames: [],
    habitIndex: 0,
    currentHabitId: null,
    todayChecked: false,
    loadingToday: false,
    note: '',
    showCreateModal: false,
    newHabitTitle: ''
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

        this.setData({
          habits,
          habitNames,
          habitIndex,
          currentHabitId,
          todayChecked: false
        });

        if (currentHabitId) {
          this.fetchTodayStatus();
        }
      })
      .catch(() => {
        this.setData({ habits: [], habitNames: [], currentHabitId: null, todayChecked: false });
      });
  },
  fetchTodayStatus() {
    const { currentHabitId } = this.data;
    if (!currentHabitId) return;
    this.setData({ loadingToday: true, todayChecked: false });
    api.checkins
      .today(currentHabitId)
      .then((res) => {
        this.setData({ todayChecked: parseTodayChecked(res) });
      })
      .catch(() => {
        this.setData({ todayChecked: false });
      })
      .finally(() => {
        this.setData({ loadingToday: false });
      });
  },
  onHabitChange(e) {
    const habitIndex = Number(e.detail.value || 0);
    const habit = this.data.habits[habitIndex];
    const currentHabitId = habit ? habit.id : null;
    store.setCurrentHabitId(currentHabitId);
    this.setData({ habitIndex, currentHabitId, todayChecked: false, note: '' });
    if (currentHabitId) {
      this.fetchTodayStatus();
    }
  },
  onToggleHabit(e) {
    const habitId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const isActive = e.detail.value;

    api.habits
      .toggle(habitId, isActive)
      .then(() => {
        const habits = this.data.habits.slice();
        if (habits[index]) {
          habits[index].is_active = isActive;
        }
        this.setData({ habits });
      })
      .catch(() => {
        // revert UI if failed
        const habits = this.data.habits.slice();
        if (habits[index]) {
          habits[index].is_active = !isActive;
        }
        this.setData({ habits });
      });
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },
  onCheckin() {
    const { currentHabitId, todayChecked, note, loadingToday } = this.data;
    if (!currentHabitId || todayChecked || loadingToday) return;

    this.setData({ loadingToday: true });
    api.checkins
      .checkin(currentHabitId, note)
      .then(() => {
        wx.showToast({ title: '打卡成功', icon: 'success' });
        this.setData({ todayChecked: true, note: '' });
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ loadingToday: false });
      });
  },
  onOpenCreate() {
    this.setData({ showCreateModal: true, newHabitTitle: '' });
  },
  onCloseCreate() {
    this.setData({ showCreateModal: false, newHabitTitle: '' });
  },
  onCreateInput(e) {
    this.setData({ newHabitTitle: e.detail.value });
  },
  onCreateHabit() {
    const title = (this.data.newHabitTitle || '').trim();
    if (!title) {
      wx.showToast({ title: '请输入习惯标题', icon: 'none' });
      return;
    }

    api.habits
      .create(title)
      .then((res) => {
        if (res && res.id) {
          store.setCurrentHabitId(res.id);
        }
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.setData({ showCreateModal: false, newHabitTitle: '' });
        this.loadHabits();
      })
      .catch(() => {});
  }
});
