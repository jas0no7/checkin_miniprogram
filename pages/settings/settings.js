const request = require('../../utils/request');
const store = require('../../utils/store');

Page({
  data: {
    baseURL: ''
  },
  onLoad() {
    this.setData({ baseURL: store.getBaseURL() });
  },
  onBaseURLInput(e) {
    this.setData({ baseURL: e.detail.value });
  },
  onSave() {
    const value = (this.data.baseURL || '').trim();
    if (!value) {
      wx.showToast({ title: '请输入 baseURL', icon: 'none' });
      return;
    }
    store.setBaseURL(value);
    wx.showToast({ title: '已保存', icon: 'success' });
  },
  onHealthCheck() {
    request({ url: '/health' })
      .then(() => {
        wx.showToast({ title: '后端可用', icon: 'success' });
      })
      .catch(() => {});
  }
});
