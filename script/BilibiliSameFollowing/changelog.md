# [B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliSameFollowing)。

## V1.8

1. 脚本：适配B站 2021 年 9 月对于用户卡片的改版。
2. 脚本：移除直播间及常规用户卡片的开关选项，它们现在总会被开启。相应地，配置说明也不必要了，移除之。
3. 脚本：优化配置定义及读取流程。
4. 代码：偏好于 `Object.entries()`、`Object.keys()`、`Object.values()`。
5. UI：优化文本。

## V1.7

1. 外部：`UserscriptAPI` 更新至 V2.2。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIBase` 更新至 V1.2，`UserscriptAPILogger` 更新至 V1.2。
3. 外部：`UserscriptAPIWait` 更新至 V1.2，优化错误处理流程。
4. 外部：`UserscriptAPIWeb` 更新至 V1.2，优化错误处理流程。
5. 外部：移除 `UserscriptAPIDom`、`UserscriptAPIMessage`。
6. 脚本：优化版本更新机制。
7. 脚本：优化卡片处理逻辑，避免页面重定向导致的初始化错误。
8. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.6

1. 外部：`UserscriptAPI` 更新至 V2.0，实现 API 模块化。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIMessage` 更新至 V1.1，引入对话框组件。
3. 脚本：修复在 Firefox 上有概率无法正常执行的问题。

## V1.5

1. 共同关注：增加选项「显示目标用户与自己的关系」（如悄悄关注、特别关注、互粉、拉黑）。
2. 共同关注：增加选项「以关注时间降序显示」。
3. 脚本：重新设计脚本选项逻辑，简化菜单。
4. 脚本：更新兼容性说明。
5. UI：共同关注默认以目标用户的关注时间升序显示。
6. UI：非以纯文本形式显示时，用特殊格式标注出特殊用户（如特别关注、互粉）。
7. UI：针对提示信息选项，修复部分信息无法被提示的问题。
8. UI：优化文字排版。
9. 代码：引入类字段声明。
10. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。
11. 外部：`UserscriptAPI` 升级至 V1.8，大幅优化元素等待逻辑，引入网络请求检查、解析、报告功能。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 上个版本最后都更到 `v1.4.45`，挺离谱的——尽管大部分都是跟随性更新……

## V1.4

1. 共同关注：在直播间中实现功能。
2. 脚本：主要逻辑推迟至 `load` 事件执行。
3. 脚本：支持通过 `<iframe>` 嵌套的特殊直播间。
4. 脚本：优化错误处理流程。
5. 脚本：优化 URL 匹配。
6. 外部：`UserscriptAPI` 升级至 V1.5，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
7. UI：优化直播间中的共同关注显示。
8. 代码：优化异常处理。
9. 代码：优先使用函数声明而非函数表达式来定义内部函数。

## V1.3

1. 外部：`UserscriptAPI` 升级至 V1.1，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 代码：借助新版元素等待 API 进行大幅简化。
3. 脚本：优化更新处理机制。

## V1.2

1. 共同关注：完善功能覆盖范围。针对一些奇奇怪怪地方弹出的用户卡片，也能正确处理。
2. 共同关注：增加选项「以纯文本形式显示」（共同关注改为默认以可点击形式展示）。
3. 共同关注：增加选项「无共同关注时提示信息」。
4. 脚本：大幅优化用户配置方式，优化设置项分类及功能，并添加配置说明。
5. 脚本：优化 URL 匹配。
6. 脚本：添加版本更新处理机制。
7. 脚本：增加功能「初始化脚本」。
8. UI：优化文字排版。
9. 代码：不算是重构的重构。

## V1.1

1. 脚本：增加选项以显示/隐藏查询失败的提示信息。
2. 脚本：分别为常规用户卡片、UP主卡片、用户空间添加功能开关。

## V1.0

1. 共同关注：在用户卡片和用户空间中实现功能。
