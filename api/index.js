const request = require('../utils/request');

const habits = {
  list() {
    return request({ url: '/api/v1/habits' });
  },
  create(title) {
    return request({
      url: '/api/v1/habits',
      method: 'POST',
      data: { title }
    });
  },
  toggle(habitId, isActive) {
    return request({
      url: `/api/v1/habits/${habitId}`,
      method: 'PATCH',
      data: { is_active: isActive }
    });
  }
};

const checkins = {
  today(habitId) {
    return request({
      url: `/api/v1/checkins/today?habit_id=${habitId}`
    });
  },
  checkin(habitId, note) {
    const data = { habit_id: habitId };
    if (note) {
      data.note = note;
    }
    return request({
      url: '/api/v1/checkins',
      method: 'POST',
      data
    });
  }
};

const calendar = {
  month(monthStr) {
    return request({
      url: `/api/v1/calendar?month=${monthStr}`
    });
  }
};

const stats = {
  get(habitId) {
    return request({
      url: `/api/v1/stats?habit_id=${habitId}`
    });
  }
};

module.exports = {
  habits,
  checkins,
  calendar,
  stats
};
