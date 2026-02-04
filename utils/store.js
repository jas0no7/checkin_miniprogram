const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';

function getBaseURL() {
  return wx.getStorageSync('base_url') || DEFAULT_BASE_URL;
}

function setBaseURL(url) {
  wx.setStorageSync('base_url', url);
}

function getCurrentHabitId() {
  return wx.getStorageSync('current_habit_id') || null;
}

function setCurrentHabitId(id) {
  if (id === null || id === undefined || id === '') {
    wx.removeStorageSync('current_habit_id');
    return;
  }
  wx.setStorageSync('current_habit_id', id);
}

module.exports = {
  DEFAULT_BASE_URL,
  getBaseURL,
  setBaseURL,
  getCurrentHabitId,
  setCurrentHabitId
};
