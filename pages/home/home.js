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

function buildActiveState(habits, storedId) {
  const activeHabits = habits.filter((item) => item.is_active !== false);
  const activeHabitNames = activeHabits.map((item) => item.title);
  let activeHabitIndex = 0;
  let currentHabitId = null;

  if (activeHabits.length > 0) {
    if (storedId) {
      const foundIndex = activeHabits.findIndex((item) => `${item.id}` === `${storedId}`);
      if (foundIndex >= 0) {
        activeHabitIndex = foundIndex;
      }
    }
    currentHabitId = activeHabits[activeHabitIndex].id;
  }

  const hasHabits = habits.length > 0;
  let currentHabitName = '请先创建习惯';
  let bubbleTip = '点左上角新建';
  if (activeHabits.length > 0) {
    currentHabitName = activeHabits[activeHabitIndex].title;
    bubbleTip = '点击切换';
  } else if (hasHabits) {
    currentHabitName = '请先启用习惯';
    bubbleTip = '在管理中启用';
  }

  const pickerHabitNames = activeHabitNames.length > 0 ? activeHabitNames : [''];

  return {
    activeHabits,
    activeHabitNames,
    activeHabitIndex,
    currentHabitId,
    currentHabitName,
    bubbleTip,
    pickerHabitNames
  };
}

Page({
  data: {
    habits: [],
    activeHabits: [],
    activeHabitNames: [],
    activeHabitIndex: 0,
    currentHabitId: null,
    currentHabitName: '请先创建习惯',
    bubbleTip: '点左上角新建',
    pickerHabitNames: [''],
    todayChecked: false,
    loadingToday: false,
    showCreateModal: false,
    newHabitTitle: '',
    showNoteModal: false,
    noteInput: '',
    showManage: false
  },
  onShow() {
    this.loadHabits();
  },
  loadHabits() {
    api.habits
      .list()
      .then((res) => {
        const habits = normalizeHabits(res);
        this.applyHabits(habits);
      })
      .catch(() => {
        this.applyHabits([]);
      });
  },
  applyHabits(habits) {
    const storedId = store.getCurrentHabitId();
    const state = buildActiveState(habits, storedId);

    if (state.currentHabitId) {
      store.setCurrentHabitId(state.currentHabitId);
    } else {
      store.setCurrentHabitId(null);
    }

    this.setData({
      habits,
      ...state,
      todayChecked: false
    });

    if (state.currentHabitId) {
      this.fetchTodayStatus();
    }
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
    const activeHabitIndex = Number(e.detail.value || 0);
    const habit = this.data.activeHabits[activeHabitIndex];
    const hasHabits = this.data.habits.length > 0;
    const currentHabitId = habit ? habit.id : null;
    const currentHabitName = habit
      ? habit.title
      : (hasHabits ? '请先启用习惯' : '请先创建习惯');
    const bubbleTip = habit
      ? '点击切换'
      : (hasHabits ? '在管理中启用' : '点左上角新建');

    if (currentHabitId) {
      store.setCurrentHabitId(currentHabitId);
    } else {
      store.setCurrentHabitId(null);
    }

    this.setData({
      activeHabitIndex,
      currentHabitId,
      currentHabitName,
      bubbleTip,
      todayChecked: false
    });

    if (currentHabitId) {
      this.fetchTodayStatus();
    }
  },
  onToggleManage() {
    this.setData({ showManage: !this.data.showManage });
  },
  onStopTap() {},
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
        this.applyHabits(habits);
      })
      .catch(() => {
        const habits = this.data.habits.slice();
        if (habits[index]) {
          habits[index].is_active = !isActive;
        }
        this.setData({ habits });
      });
  },
  onCheckinTap() {
    const { currentHabitId, todayChecked, loadingToday, habits } = this.data;
    if (loadingToday) return;

    if (!currentHabitId) {
      const hasHabits = habits.length > 0;
      wx.showToast({ title: hasHabits ? '请先启用习惯' : '请先创建习惯', icon: 'none' });
      if (hasHabits) {
        this.setData({ showManage: true });
      } else {
        this.onOpenCreate();
      }
      return;
    }

    if (todayChecked) {
      wx.showToast({ title: '今天已完成', icon: 'none' });
      return;
    }

    this.setData({ showNoteModal: true, noteInput: '', showManage: false });
  },
  onNoteInput(e) {
    this.setData({ noteInput: e.detail.value });
  },
  onCloseNote() {
    this.setData({ showNoteModal: false, noteInput: '' });
  },
  onConfirmNote() {
    const note = (this.data.noteInput || '').trim();
    this.setData({ showNoteModal: false });
    this.doCheckin(note);
  },
  doCheckin(note) {
    const { currentHabitId } = this.data;
    if (!currentHabitId) return;

    this.setData({ loadingToday: true });
    api.checkins
      .checkin(currentHabitId, note)
      .then(() => {
        wx.showToast({ title: '打卡成功', icon: 'success' });
        this.setData({ todayChecked: true, noteInput: '' });
        return api.checkins.today(currentHabitId);
      })
      .then((res) => {
        this.setData({ todayChecked: parseTodayChecked(res) });
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ loadingToday: false });
      });
  },
  onOpenCreate() {
    this.setData({ showCreateModal: true, newHabitTitle: '', showManage: false });
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