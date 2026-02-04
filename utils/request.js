const { getBaseURL } = require('./store');

function normalizeUrl(path) {
  const base = getBaseURL().replace(/\/$/, '');
  if (!path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header,
    showError = true
  } = options || {};

  return new Promise((resolve, reject) => {
    wx.request({
      url: normalizeUrl(url),
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(header || {})
      },
      success: (res) => {
        const { statusCode, data: resData } = res;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(resData);
          return;
        }
        const message = (resData && resData.detail) || `请求失败(${statusCode})`;
        if (showError) {
          wx.showToast({ title: message, icon: 'none' });
        }
        reject(new Error(message));
      },
      fail: (err) => {
        const message = err.errMsg || '网络错误';
        if (showError) {
          wx.showToast({ title: message, icon: 'none' });
        }
        reject(err);
      }
    });
  });
}

module.exports = request;
