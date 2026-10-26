# Open-source release decisions

2026-10-26: Keep the supplied V1.1.4 functionality and local-only data ownership. Public branding becomes 工休伴侣 / Workday Rhythm; legacy storage identifiers remain stable so upgrades retain user data.

Do not copy existing private Git history. Create an independent public repository and grant Mary-Wym write access through a GitHub invitation.

Retain generic test fixtures: artificial salary numbers and mock schedules are necessary to verify calculations and migration, and are not user records. Preserve empty runtime defaults.

Package only after all required checks pass. Do not treat local static checks as evidence of WeChat device rendering or remote Actions success.

## 2026-10-26 · 项目展示与贡献者

- 重写功能导向 README，加入 SVG 功能概览和 Mermaid 使用流程。示意图不代表真机截图。
- 列出 Mary-Wym 为共同开发者 / Contributor；不冒用贡献者身份创建提交。
- About 使用项目功能梗概；文档更新不改变功能版本、运行逻辑或数据格式。

## 2026-10-26 · 品牌与共同作者更新

- README 移除开发者名单，保留贡献流程。
- 按维护者指定的 project1 方式，在本次发布提交中使用 Co-authored-by 关联 Mary-wym，账号采用 GitHub 数字 ID 对应的 noreply 地址。
