# 每日自律打卡小程序（前端）

## 导入项目
1. 打开微信开发者工具，选择“导入项目”。
2. 目录选择 `checkin_miniprogram`。
3. AppID 可使用测试号（或填你自己的小程序 AppID）。
4. 语言选择 JavaScript。

## 配置后端地址
1. 打开小程序“给我配置”页。
2. 输入后端 `baseURL`（默认 `http://127.0.0.1:8000`）。
3. 点击“保存”。
4. 真机调试时，请改为电脑的局域网 IP，例如 `http://192.168.x.x:8000`。

## 与后端联调
后端为 FastAPI（无登录鉴权，默认 `user_id=1`），需要支持以下接口：
- `GET  /health`
- `POST /api/v1/habits` `{title}`
- `GET  /api/v1/habits`
- `PATCH /api/v1/habits/{habit_id}` `{is_active}`
- `POST /api/v1/checkins` `{habit_id, checkin_date(可选), note(可选)}`
- `GET  /api/v1/checkins/today?habit_id=...`
- `GET  /api/v1/calendar?month=YYYY-MM`
- `GET  /api/v1/stats?habit_id=...`

建议先在后端侧运行：
- 确认 `GET /health` 返回 OK（或 200）
- 再在小程序“设置”页点击“健康检查”验证连通性

## 目录结构
- `app.js / app.json / app.wxss`
- `pages/home/*` 首页
- `pages/calendar/*` 月历
- `pages/stats/*` 统计
- `pages/settings/*` 设置
- `utils/request.js` 请求封装
- `utils/store.js` 本地存储与当前习惯管理
- `api/index.js` API 模块
