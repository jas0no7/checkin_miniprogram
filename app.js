const store = require('./utils/store');

App({
  onLaunch() {
    // Initialize base URL if missing
    const saved = wx.getStorageSync('base_url');
    if (!saved) {
      store.setBaseURL(store.DEFAULT_BASE_URL);
    }
  },
  globalData: {}
});
