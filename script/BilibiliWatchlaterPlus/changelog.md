# [B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliWatchlaterPlus/BilibiliWatchlaterPlus.js)。

## V4.10

1. 自动移除：列表页面中增加一个「自动移除」按钮，用于直接控制在列表页面中打开视频时是否执行自动移除逻辑，也就是给予用户一个临时切换的开关。相应地，为该功能新增「彻底禁用自动移除」选项。

> 离上一次真正意义上的功能性更新已过去许久，这段时间修修补补都把 V4.9 的小版本推到 19 了。估计在本脚本的加持下，「稍后再看」这一功能已经相当完善了。
>
> 要进一步改进，无外乎彻底抛弃B站后端，实现一个本地的「稍后再看」。如果想做得再完善一点，也就是做好本地和官方「稍后再看」数据的同步——但这真的有必要吗？
>
> 另一方面，官方的「稍后再看」也确实以蜗牛般的速度在改进……尽管，从这个脚本第一天创建到现在，共一年半时间，B站程序员并没有让这个功能在实质上变得更好用，反而弄出了前段时间超级反人类的稍后再看模式播放页。
>
> 其实也没什么好抒发的，只是希望官方能在恶心用户这方面适可而止。这段时间 APP 上的稍后再看被「优化」成了一坨屎的样子，底栏和直播更是作出抖音化的改动，可真把我给恶心到了💢💢💢

## V4.9

1. 功能移除：确保视频一致性。经过大半年时间，B站的程序员总算发现视频不一致的 BUG 并将其修好。既然如此，这一功能已经没有存在的必要了，移除。
2. 功能实现：禁用页面缓存。
3. 功能实现：在设置页中隐藏被禁用项的子项。
4. 顶栏入口：重做弹出菜单，不再引用B站原生的稍后再看列表组件，并在其中实现搜索、状态切换、快捷功能等功能。对应地，增加隐藏「收藏」中「稍后再看」功能。感谢 [79115](https://greasyfork.org/zh-CN/scripts/395456/discussions/79115) 让我下定重做这一功能的决心。
5. 顶栏入口：添加「移除稍后再看已观看视频」功能，可在入口上通过各种方式调用。
6. 重定向：不再影响「播放全部」等相关功能。
7. 重定向：修复重定向时没有传递查询参数的问题。该问题会导致重定向时无法执行自动移除功能，以及一系列潜在问题。
8. 脚本：适配B站稍后再看模式播放页改版，这次改版导致了重定向以及涉及到稍后再看模式播放页的种种功能均出现一定问题。

> 忍不住吐槽一下，之前B站那个稍后再看模式播放页设计得实在是太蠢了。其设计逻辑反人类，导致 BUG 一堆且巨难用。上一版本的脚本不得不花了很大力气在该页面上缝缝补补，尤其是「确保视频一致性」这一帮官方修 BUG 的功能，使用了大量奇技淫巧。实际上这些问题从官方角度非常好解决，这次B站对该页面的更新正好就说明了这一点。

## V4.8

1. 顶栏入口：增加中键点击功能，并增加「清空稍后再看」快捷功能。见 [64830](https://greasyfork.org/zh-CN/scripts/395456/discussions/64830)。
2. 顶栏入口：修复在弹出菜单中，非稍后再看（收藏夹）中的视频卡片也被添加自动移除逻辑的问题。见 [74371](https://greasyfork.org/zh-CN/scripts/395456/discussions/74371)。

## V4.7

1. 脚本：明确「稍后再看列表数据」和「稍后再看历史数据」这两个概念，在代码以及 UI 上进行统一。其中，前者指单次获取到稍后再看列表数据，大部分情况下特指当前时间点获取到的稍后再看列表数据；后者是前者的历史集合。
2. 脚本：明确「页面缓存」和「本地缓存」这两个概念，在代码以及 UI 上进行统一。其中，前者指通过 `GMObject` 保存在内存上的缓存数据，后者指通过 `GM_setValue()` 保存在脚本数据库上的缓存数据。
3. 脚本：在本地对稍后再看列表数据进行缓存，本地缓存有效期内将会使用其来代替网络请求，除非是在有必要确保数据正确性的场合。
4. 功能实现：对稍后再看列表数据本地缓存有效期进行设置。
5. 代码：配置默认值、极值硬编码进 `configMap` 中，而不再作为脚本常量看待。

## V4.6

1. 脚本：兼容性处理。
2. 脚本：匹配时，改用黑名单的方式来排除特殊页面，并修复一系列代码在本不该执行的页面上执行的问题。
3. 脚本：修复打开稍后再看模式播放页面后长时间放置而没有切换过去，导致脚本逻辑执行失败的问题。
4. 脚本：根据脚本传递的 URL 查询参数处理完成后，才将这些参数从 URL 中移除。
5. 脚本：大量微小的问题修复以及功能改进。

## V4.5

1. API：将 `API` 类剥离出来，作为一个通用代码库使用。以后关于 API 的更新说明见 [API.js 提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/lib/API.js)。

## V4.4

1. 功能实现：在动态页面、视频播放页面，甚至更多地方填充缺失的稍后再看状态信息。
2. 移除记录：支持稍后再看列表数据的模糊比对，舍弃可能重复的数据。
3. 功能性更新设置：高亮显示更新涉及到的功能。

## V4.3

1. 移除记录：修复数据获取失败时往数据库中写入错误数据，并进一步导致脚本运行错误的问题。
2. UI：引入 CSS 变量进行样式标准化。
3. API：引入 `logger` API 对日志输出进行标准化。
4. 代码：从 V2 开始，脚本代码就存在 `document-start` 和 `document-idle` 两个运行时机，因而被强行割裂为两部分。之前个人一直不愿意将不必要的代码注入到 `document-start` 时期执行，这给脚本的编写带来非常多的麻烦。这个版本终于痛下决心，以几乎可以忽略的性能代价彻底解决了代码割裂的问题（其实对加载速度的影响大概也就 `0.1ms`，都不知道之前在纠结什么）。

## V4.2

1. 脚本：设置页重做，采用更为合理的 DOM 结构，方便以后扩展。
2. 移除记录：现在这个功能不再局限于列表页面，而是作为全局功能，用户可以设置在什么时间点保存稍后再看历史数据。

## V4.1

1. 脚本：当前稍后再看列表数据的获取，改为懒加载方式，为后面要实现的功能开路。
2. 脚本：对于脚本在 URL 中引入的查询参数，现在会在读取后移除以避免产生不好的用户体验。
3. 确保视频一致性：若打开稍后再看模式播放页时，目标视频不在稍后再看中，询问是否跳转到普通模式播放。
4. 移除记录：修复警告项在不恰当时候出现的问题，修复警告信息框显示效果错误的问题。
5. API：引入 `request` API 处理网络请求，并优化异常处理的方式。

## V4.0

1. 功能实现：打开视频时自动将其移除出稍后再看。
2. 状态快速切换：放弃借助页面上 `Vue` 对象进行控制的做法，直接使用 B 站 API 来实现相关功能。
3. 功能性更新设置：更新后强制进行初始化设置定位修改为更新后打开设置，不会进行初始化，并默认开启。
4. API：`wait` API 支持异步条件。
5. 代码：开源，Greasy Fork 上使用源代码同步方式更新脚本。

## V3.5

1. API：强加各类 API，在一些回调上通过 `this` 附加必要信息。
2. 代码：重构，OOP 化。

## V3.4

1. 脚本：与个人的其他脚本之间进行功能适配，确保它们不会因为执行时间点不同而导致不同的表现。
2. UI：放弃幻想，弃用 `transform`，彻底解决字体发虚的问题。这个问题在每个浏览器上都会有不同的表现，且会受到扩展和用户脚本的影响，搞不来。

## V3.3

1. 移除记录：明确排序规则，提供升序和降序。

## V3.2

1. 功能实现：确保视频的一致性（避免点击A视频却打开B视频的问题）。
2. 顶栏入口：引入 `MutationObserver` 对弹出菜单进行处理，真正意义上彻底解决网速不足带来的问题。
3. API：大量 API 功能增强。

## V3.1

1. 功能实现：隐藏列表页面中的「一键清空」和「移除已观看视频」按钮。
2. 顶栏入口：可对弹出菜单中的滚动条进行美化，或直接将其隐藏。为了保持一致性，顶栏中其他入口，如「历史」「动态」的弹出菜单也会受到影响。
3. 移除记录：相关数据改为懒加载，优化页面加载速度。
4. 代码：引入枚举类型，并加强配置的读写校验。

## V3.0

1. 顶栏入口：彻底理解弹出菜单的机制，以及解决相关的疑难问题，终于不会因为鼠标抽搐、网速不给力等原因引入奇奇怪怪的现象。同时，弹出菜单上指示来源的小三角也能正确地指向稍后再看入口或收藏入口。
2. 重置脚本：不再清理移除记录使用到的数据与相关配置。
3. 移除记录：增加存储列表页面数据条数的显示与清理功能。
4. 代码：文档标准化。

## V2.10

1. 顶栏入口：鼠标在顶栏入口与收藏入口之间切换时，弹出菜单中选择的类别也会跟随切换。见 [54302](https://greasyfork.org/zh-CN/scripts/395456/discussions/54302)。
2. 顶栏入口：现在整个稍后再看/收藏弹出菜单中的所有视频，都能设置在当前页面或新标签页打开。
3. API：`wait` API 增加异步版本，并大幅强化功能及修复相关的隐性 BUG。

## V2.9

1. 移除记录：在用户设置中配置相关选项时，若设置可能会导致性能问题或内部数据清理，则发出警告。
2. 设置完成后刷新：检测到配置有更改，以及更改的配置必须要刷新页面才能生效时才会进行刷新。

## V2.8

1. 脚本：建立相对完善的版本更新处理机制。
2. 功能实现：功能性更新后强制进行初始化设置。
3. 移除记录：进行性能测试，确保相关配置的临界范围，并采用更合理的初始值。
4. 重定向：修复执行重定向后没有终止剩余代码执行的问题，大幅优化重定向速度和用户体验。

## V2.7

1. 状态快速切换：支持稍后再看模式播放页。见 [54196](https://greasyfork.org/zh-CN/scripts/395456/discussions/54196)。
2. API：实现 `message` API，并用于代替 `alert` 来提醒用户信息。

## V2.6

1. 代码：重构。

## V2.5

1. 脚本：将尽可能多的代码执行移至 `DOMContentLoaded` 事件响应中执行，优化网页加载和重定向速度。
2. 脚本：用户配置读取错误时的处理逻辑优化。
3. 顶栏入口：增加右键点击功能，并优化左键点击的处理逻辑。
4. 顶栏入口：点击弹出菜单中的稍后再看视频时，可选择在当前页面或新标签页打开。
5. 移除记录：增加默认历史回溯深度的设置，并对移除记录功能进行优化。
6. 重置脚本：重置时会清理 GM 数据库。
7. 代码：引入 eslint 对代码风格化。

## V2.4

1. 代码：HTML 与 CSS 标识符标准化。

## V2.3

1. 脚本：用户配置校验，以及简单的升级机制构建。
2. 功能实现：设置完成后是否立即刷新页面。
3. 顶栏入口：支持对点击时执行的操作进行设置。
4. 移除记录：支持历史回溯深度的设置，方便定位。
5. 重定向：处理时停止原页面的加载，大幅优化速度和用户体验。
6. UI：改善文本表述，尽量使用普通用户能看得懂的语言说话……

## V2.2

1. 脚本：性能优化。
2. 脚本：UI 优化及易用性改进。
3. 代码：格式标准化。

## V2.1

1. 功能实现：重置脚本。
2. 移除记录：稍后再看记录功能更改定位为移除记录，并大幅增强功能功能，使其可保留多个版本的历史信息，并通过对比直接显示出当前移除了哪些视频。
3. UI：大幅优化，包括且不限于增加动画效果，为用户提供更好的体验。
4. API：实现 `PushQueue` API，用于保存稍后再看历史数据。

## V2.0

1. 脚本：为脚本提供的功能提供开关，并提供用户友好的设置页。
2. 功能实现：稍后再看记录功能。
3. 功能实现：将 [B站「稍后再看」重定向](https://greasyfork.org/zh-CN/scripts/383441) 脚本整合进来。
4. 功能实现：列表页面内点击视频时，在新标签页中打开视频。见 [383441-46595](https://greasyfork.org/zh-CN/scripts/383441/discussions/46595)。

## V1

1. 功能实现：在顶栏中加入被 B 站官方移除的稍后再看入口，支持与收藏入口的弹出菜单联动等简单功能。
2. 功能实现：在普通模式视频播放页中加入快速切换稍后再看状态的按钮。
3. API：初步实现等待元素加载 / 等待条件达成的 `wait` API。

*by Laster2800*