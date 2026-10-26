# 工休伴侣 · Workday Rhythm

微信原生工作日清单、工资进度与休息计时工具，功能基线 **V1.1.4**。将每天要做的事、下班倒计时、休息记录和日报放在一起，所有运行数据保存在本机。

## 功能

- 90 条通用清单预设，支持条目和分类管理、每日固定模板、今日微调与打卡。
- 今日微调支持新增、编辑、删除；日期级勾选与长期条目维护保持分离。
- 月薪、日薪、时薪设置，实时工资估算、下班倒计时和时间占用分析。
- 3/5/10/15 分钟快捷休息、手动计时、休息类型与每日额度。
- 近七日统计、连续使用、徽章、随机休息建议和日报。
- 隐身模式与金额隐藏，日报图片同样尊重金额隐藏设置。
- 三档字号、回收站、本地 JSON 备份和恢复、微信原生分享。

## 运行

在微信开发者工具中导入包含 `project.config.json` 的根目录。`miniprogramRoot` 为 `miniprogram/`，公开 AppID 为 `touristappid`。合法 AppID 仅用于本机调试，提交前恢复占位值并运行隐私检查。

包含五个 Tab 和一个日报页面。无服务器、登录、云同步、广告或第三方统计。日报使用本地 Canvas 和相册 API。

## 验证与打包

需要 Python 3.10+、Node.js 22+，运行时无第三方依赖。

```sh
python tools/quality_gate.py --project .
node tools/privacy_test.js
python tools/prepublish_check.py
python tools/workflow.py all
```

全量工作流运行结构、语法、12 组业务回归与隐私检查，输出 `release/` 下 ZIP、SHA-256 和包内文件清单。GitHub Actions 运行离线回归，不上传微信或部署云服务。

## 本地数据

首次启动工资金额为空，打卡、计时、今日调整、访问历史和回收站均为空。通用条目预设不是用户记录。测试中的工资数字与历史均为人工构造的断言样例。

保留 Schema v5 和 `moyu_workday_companion_state` / `moyu_workday_companion_schema_version` 及旧版本迁移；改品牌不改变用户数据或自定义标题。管理页可确认后恢复初始数据。导出的备份包含私人信息，不要上传仓库或公开 Issue。

## 贡献与许可

原创代码采用 MIT，见 `LICENSE`。项目图片为随输入包提供的项目自制通用素材，原私人参考截图不发布。贡献见 `CONTRIBUTING.md`。共同开发者邀请目标为 GitHub 用户 `Mary-Wym`，实际权限以接受邀请后的状态为准。

后续优先完善小屏和大字号真机验收、计时后台恢复及备份兼容性。微信开发者工具、相册权限、真机分享及布局仍需人工检查，见 `QA_REPORT.md`。
