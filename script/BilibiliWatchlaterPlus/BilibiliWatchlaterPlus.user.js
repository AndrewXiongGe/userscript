// ==UserScript==
// @name            B站稍后再看功能增强
// @version         4.17.9.20210814
// @namespace       laster2800
// @author          Laster2800
// @description     与稍后再看功能相关，一切你能想到和想不到的功能
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/395456
// @supportURL      https://greasyfork.org/zh-CN/scripts/395456/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://message.bilibili.com/*
// @include         *://search.bilibili.com/*
// @include         *://space.bilibili.com/*
// @include         *://account.bilibili.com/*
// @exclude         *://message.bilibili.com/*/*
// @exclude         *://t.bilibili.com/h5/*
// @exclude         *://www.bilibili.com/page-proxy/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=960119
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           window.onurlchange
// @connect         api.bilibili.com
// @run-at          document-start
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  if (GM_info.scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    script.author = script.author ?? 'Laster2800'
    script.homepage = script.homepage ?? 'https://greasyfork.org/zh-CN/scripts/395456'
    script.supportURL = script.supportURL ?? 'https://greasyfork.org/zh-CN/scripts/395456/feedback'
  }

  const sortType = {
    default: 'serial',
    defaultR: 'serial:R',
    duration: 'duration',
    durationR: 'duration:R',
    progress: 'progress',
    uploader: 'uploader',
    title: 'vTitle',
  }
  /**
   * 脚本内用到的枚举定义
   */
  const Enums = {
    /**
     * @readonly
     * @enum {string}
     */
    headerButtonOp: {
      openListInCurrent: 'openListInCurrent',
      openListInNew: 'openListInNew',
      playAllInCurrent: 'playAllInCurrent',
      playAllInNew: 'playAllInNew',
      clearWatchlater: 'clearWatchlater',
      clearWatchedInWatchlater: 'clearWatchedInWatchlater',
      openUserSetting: 'openUserSetting',
      openRemoveHistory: 'openRemoveHistory',
      noOperation: 'noOperation',
    },
    /**
     * @readonly
     * @enum {string}
     */
    headerMenu: {
      enable: 'enable',
      enableSimple: 'enableSimple',
      disable: 'disable',
    },
    /**
     * @readonly
     * @enum {string}
     */
    headerCompatible: {
      none: 'none',
      bilibiliEvolved: 'bilibiliEvolved',
    },
    /**
     * @readonly
     * @enum {string}
     */
    sortType: sortType,
    /**
     * @readonly
     * @enum {string}
     */
    autoSort: {
      auto: 'auto',
      ...sortType,
    },
    /**
     * @readonly
     * @enum {string}
     */
    openHeaderMenuLink: {
      openInCurrent: 'openInCurrent',
      openInNew: 'openInNew',
    },
    /**
     * @readonly
     * @enum {string}
     */
    removeHistorySavePoint: {
      list: 'list',
      listAndMenu: 'listAndMenu',
      anypage: 'anypage',
    },
    /**
     * @readonly
     * @enum {string}
     */
    fillWatchlaterStatus: {
      dynamic: 'dynamic',
      dynamicAndVideo: 'dynamicAndVideo',
      anypage: 'anypage',
      never: 'never',
    },
    /**
     * @readonly
     * @enum {string}
     */
    autoRemove: {
      always: 'always',
      openFromList: 'openFromList',
      never: 'never',
      absoluteNever: 'absoluteNever',
    },
    /**
     * @readonly
     * @enum {string}
     */
    openListVideo: {
      openInCurrent: 'openInCurrent',
      openInNew: 'openInNew',
    },
    /**
     * @readonly
     * @enum {string}
     */
    menuScrollbarSetting: {
      beautify: 'beautify',
      hidden: 'hidden',
      original: 'original',
    },
    /**
     * @readonly
     * @enum {string}
     */
    mainRunAt: {
      DOMContentLoaded: 'DOMContentLoaded',
      load: 'load',
    }
  }
  // 将名称不完全对应的补上，这样校验才能生效
  Enums.headerButtonOpL = Enums.headerButtonOpR = Enums.headerButtonOpM = Enums.headerButtonOp

  const gmId = 'gm395456'
  /**
   * 全局对象
   * @typedef GMObject
   * @property {string} id 脚本标识
   * @property {number} configVersion 配置版本，为最后一次执行初始化设置或功能性更新设置时脚本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号，只要涉及到配置的修改都要更新；若同一天修改多次，可以追加小数来区分
   * @property {URLSearchParams} searchParams URL 查询参数
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_configMap} configMap 用户配置属性
   * @property {GMObject_infoMap} infoMap 信息属性
   * @property {string[]} configDocumentStart document-start 时期配置
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {{[c: string]: *}} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} headerButton 顶栏入口
   * @property {headerButtonOp} headerButtonOpL 顶栏入口左键点击行为
   * @property {headerButtonOp} headerButtonOpR 顶栏入口右键点击行为
   * @property {headerButtonOp} headerButtonOpM 顶栏入口中键点击行为
   * @property {headerMenu} headerMenu 顶栏入口弹出菜单设置
   * @property {openHeaderMenuLink} openHeaderMenuLink 顶栏弹出菜单链接点击行为
   * @property {boolean} headerMenuKeepRemoved 弹出菜单保留被移除视频
   * @property {boolean} headerMenuSearch 弹出菜单搜索框
   * @property {boolean} headerMenuSortControl 弹出菜单排序控制器
   * @property {boolean} headerMenuAutoRemoveControl 弹出菜单自动移除控制器
   * @property {boolean} headerMenuFnSetting 弹出菜单：设置
   * @property {boolean} headerMenuFnHistory 弹出菜单：历史
   * @property {boolean} headerMenuFnRemoveAll 弹出菜单：清空
   * @property {boolean} headerMenuFnRemoveWatched 弹出菜单：移除已看
   * @property {boolean} headerMenuFnShowAll 弹出菜单：显示
   * @property {boolean} headerMenuFnPlayAll 弹出菜单：播放
   * @property {boolean} headerCompatible 兼容第三方顶栏
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {removeHistorySavePoint} removeHistorySavePoint 保存稍后再看历史数据的时间点
   * @property {number} removeHistoryFuzzyCompare 模糊比对深度
   * @property {number} removeHistorySaves 稍后再看历史数据记录保存数
   * @property {boolean} removeHistoryTimestamp 使用时间戳优化移除记录
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {fillWatchlaterStatus} fillWatchlaterStatus 填充稍后再看状态
   * @property {autoSort} autoSort 自动排序
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {autoRemove} autoRemove 自动将视频从播放列表移除
   * @property {boolean} redirect 稍后再看模式重定向至普通模式播放
   * @property {boolean} listSearch 列表页面搜索框
   * @property {boolean} listSortControl 列表页面排序控制器
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} removeButton_removeAll 移除「一键清空」按钮
   * @property {boolean} removeButton_removeWatched 移除「移除已观看视频」按钮
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出菜单的滚动条设置
   * @property {boolean} hideWatchlaterInCollect 隐藏「收藏」中的「稍后再看」
   * @property {mainRunAt} mainRunAt 主要逻辑运行时期
   * @property {boolean} disablePageCache 禁用页面缓存
   * @property {number} watchlaterListCacheValidPeriod 稍后再看列表数据本地缓存有效期（单位：秒）
   * @property {boolean} hideDisabledSubitems 设置页隐藏被禁用项的子项
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @typedef {{[config: string]: GMObject_configMap_item}} GMObject_configMap
   */
  /**
   * @typedef GMObject_configMap_item
   * @property {*} default 默认值
   * @property {'string' | 'boolean' | 'int' | 'float'} [type] 数据类型
   * @property {'checked' | 'value'} attr 对应 `DOM` 元素上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [min] 最小值
   * @property {number} [max] 最大值
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @typedef {{[info: string]: GMObject_infoMap_item}} GMObject_infoMap
   */
  /**
   * @typedef GMObject_infoMap_item
   * @property {number} [configVersion] 涉及信息更改的最后配置版本
   */
  /**
   * @callback removeHistoryData 通过懒加载方式获取 `removeHistoryData`
   * @param {boolean} [remove] 是否将 `removeHistoryData` 移除
   * @returns {PushQueue<GMObject_data_item>} `removeHistoryData`
   */
  /**
   * @callback watchlaterListData 通过懒加载方式获取稍后再看列表数据
   * @param {boolean} [reload] 是否重新加载稍后再看列表数据
   * @param {boolean} [cache=true] 是否使用本地缓存
   * @param {boolean} [disablePageCache] 是否禁用页面缓存
   * @returns {Promise<GMObject_data_item0[]>} 稍后再看列表数据
   */
  /**
   * `api_queryWatchlaterList` 返回数据中的视频单元
   * @typedef GMObject_data_item0
   * @property {number} aid 视频 AV 号，务必统一为字符串格式再使用
   * @property {string} bvid 视频 BV 号
   * @property {string} title 视频标题
   * @property {number} state 视频状态
   * @property {string} [pic] 视频封面
   * @property {Object} [owner] UP 主信息
   * @property {number} [owner.mid] UP 主 ID
   * @property {string} [owner.name] UP 主名字
   * @property {number} [progress] 视频播放进度
   * @property {number} [duration] 视频时长
   * @property {number} [videos] 稿件分 P 数
   * @see {@link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/history%26toview/toview.md#获取稍后再看视频列表 获取稍后再看视频列表}
   */
  /**
   * @typedef {[bvid: string, title: string, lastModified: number]} GMObject_data_item
   * `bvid` 视频 BV 号
   * 
   * `title` 视频标题
   * 
   * `[lastModified]` 时间戳：最后被观察到的时间点
   */
  /**
   * @typedef GMObject_data
   * @property {removeHistoryData} removeHistoryData 为生成移除记录而保存的稍后再看历史数据
   * @property {watchlaterListData} watchlaterListData 当前稍后再看列表数据
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid' | 'bvid'} type `id` 类型
   * @returns {string} 查询视频信息的 URL
   */
  /**
   * @callback page_userSpace
   * @param {number} [uid] `uid`
   * @returns {string} 用户空间 URL
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} api_addToWatchlater 将视频添加至稍后再看，要求 POST 一个含 `aid` / 'bvid' 和 `csrf` 的表单
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除，移除一个视频要求 POST 一个含 `aid` 和 `csrf` 的表单，移除已观看要求 POST 一个含 `viewed=true` 和 `csrf` 的表单
   * @property {string} api_clearWatchlater 清空稍后再看，要求 POST 一个含 `csrf` 的表单
   * @property {string} page_watchlaterList 列表页面
   * @property {string} page_videoNormalMode 正常模式播放页
   * @property {string} page_videoWatchlaterMode 稍后再看模式播放页
   * @property {string} page_watchlaterPlayAll 稍后再看播放全部（临时禁用重定向）
   * @property {page_userSpace} page_userSpace 用户空间
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_watchlaterList 匹配列表页面
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看模式播放页
   * @property {RegExp} page_dynamic 匹配动态页面
   * @property {RegExp} page_dynamicMenu 匹配顶栏动态入口菜单
   * @property {RegExp} page_userSpace 匹配用户空间
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} history 移除记录
   * @property {GMObject_menu_item} entryPopup 入口弹出菜单
   */
  /**
   * @typedef GMObject_menu_item
   * @property {0 | 1 | 2 | 3 | -1} state 打开状态（关闭 | 开启中 | 打开 | 关闭中 | 错误）
   * @property {0 | 1 | 2} wait 等待阻塞状态（无等待阻塞 | 等待开启 | 等待关闭）
   * @property {HTMLElement} el 菜单元素
   * @property {() => void} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   * @property {() => void} [openedHandler] 彻底打开菜单后的回调函数
   * @property {() => void} [closedHandler] 彻底关闭菜单后的回调函数
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210810.1,
    searchParams: new URL(location.href).searchParams,
    config: {},
    configMap: {
      headerButton: { default: true, attr: 'checked' },
      headerButtonOpL: { default: Enums.headerButtonOp.openListInCurrent, attr: 'value', configVersion: 20210323 },
      headerButtonOpR: { default: Enums.headerButtonOp.openUserSetting, attr: 'value', configVersion: 20210323 },
      headerButtonOpM: { default: Enums.headerButtonOp.openListInNew, attr: 'value', configVersion: 20210323 },
      headerMenu: { default: Enums.headerMenu.enable, attr: 'value', manual: true, configVersion: 20210706 },
      openHeaderMenuLink: { default: Enums.openHeaderMenuLink.openInCurrent, attr: 'value', configVersion: 20200717 },
      headerMenuKeepRemoved: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210724 },
      headerMenuSearch: { default: true, attr: 'checked', configVersion: 20210323.1 },
      headerMenuSortControl: { default: true, attr: 'checked', configVersion: 20210810 },
      headerMenuAutoRemoveControl: { default: true, attr: 'checked', configVersion: 20210723 },
      headerMenuFnSetting: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnHistory: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveWatched: { default: false, attr: 'checked', configVersion: 20210723 },
      headerMenuFnShowAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnPlayAll: { default: true, attr: 'checked', configVersion: 20210322 },
      headerCompatible: { default: Enums.headerCompatible.none, attr: 'value', configVersion: 20210721 },
      removeHistory: { default: true, attr: 'checked', manual: true, configVersion: 20210628 },
      removeHistorySavePoint: { default: Enums.removeHistorySavePoint.listAndMenu, attr: 'value', configVersion: 20210628 },
      removeHistoryFuzzyCompare: { default: 1, type: 'int', attr: 'value', max: 5, needNotReload: true, configVersion: 20210722 },
      removeHistorySaves: { default: 100, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 10, max: 500, configVersion: 20210808 },
      removeHistoryTimestamp: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210703 },
      removeHistorySearchTimes: { default: 50, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 1, max: 500, configVersion: 20210808 },
      fillWatchlaterStatus: { default: Enums.fillWatchlaterStatus.dynamic, attr: 'value', configVersion: 20200819 },
      autoSort: { default: Enums.autoSort.default, attr: 'value', configVersion: 20210810.1 },
      videoButton: { default: true, attr: 'checked' },
      autoRemove: { default: Enums.autoRemove.openFromList, attr: 'value', configVersion: 20210612 },
      redirect: { default: false, attr: 'checked', configVersion: 20210322.1 },
      listSearch: { default: true, attr: 'checked', configVersion: 20210810.1 },
      listSortControl: { default: true, attr: 'checked', configVersion: 20210810 },
      openListVideo: { default: Enums.openListVideo.openInCurrent, attr: 'value', configVersion: 20200717 },
      removeButton_removeAll: { default: false, attr: 'checked', configVersion: 20200722 },
      removeButton_removeWatched: { default: false, attr: 'checked', configVersion: 20200722 },
      menuScrollbarSetting: { default: Enums.menuScrollbarSetting.beautify, attr: 'value', configVersion: 20210808.1 },
      hideWatchlaterInCollect: { default: false, attr: 'checked', configVersion: 20210808.1 },
      mainRunAt: { default: Enums.mainRunAt.DOMContentLoaded, attr: 'value', needNotReload: true, configVersion: 20210726 },
      disablePageCache: { default: false, attr: 'checked', configVersion: 20210322 },
      watchlaterListCacheValidPeriod: { default: 15, type: 'int', attr: 'value', needNotReload: true, max: 600, configVersion: 20210722 },
      hideDisabledSubitems: { default: true, attr: 'checked', configVersion: 20210505 },
      reloadAfterSetting: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200715 },
    },
    infoMap: {
      cleanRemoveHistoryData: {},
      fixHeader: { configVersion: 20210810.1 },
    },
    configDocumentStart: ['redirect', 'menuScrollbarSetting', 'mainRunAt'],
    data: {
      removeHistoryData: null,
      watchlaterListData: null,
    },
    url: {
      api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
      api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
      api_clearWatchlater: 'http://api.bilibili.com/x/v2/history/toview/clear',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
      page_watchlaterPlayAll: `https://www.bilibili.com/medialist/play/watchlater/?${gmId}_disable_redirect=true`,
      page_userSpace: uid => `https://space.bilibili.com/${uid}`,
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliWatchlaterPlus/changelog.md',
      external_fixHeader: 'https://greasyfork.org/zh-CN/scripts/430292',
      noop: 'javascript:void(0)',
    },
    regex: {
      // 只要第一个「#」后是「/list([/?#]|$)」即被视为列表页面
      // B站并不会将「#/list」之后的「[/?#]」视为锚点的一部分，这不符合 URL 规范，但只能将错就错了
      page_watchlaterList: /\.com\/watchlater\/[^#]*#\/list([/?#]|$)/,
      page_videoNormalMode: /\.com\/video([/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([/?#]|$)/,
      page_dynamic: /\/t\.bilibili\.com(\/|$)/,
      page_dynamicMenu: /\.com\/pages\/nav\/index_new([/?#]|$)/,
      page_userSpace: /space\.bilibili\.com([/?#]|$)/,
    },
    const: {
      rhsWarning: 10000,
      fadeTime: 400,
      textFadeTime: 100,
      updateHighlightColor: '#4cff9c',
      inputThrottleWait: 250,
    },
    menu: {
      setting: { state: 0, wait: 0, el: null },
      history: { state: 0, wait: 0, el: null },
      entryPopup: { state: 0, wait: 0, el: null }
    },
    el: {
      gmRoot: null,
      setting: null,
      history: null,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
    fadeTime: gm.const.fadeTime,
  })

  /** @type {Script} */
  let script = null
  /** @type {Webpage} */
  let webpage = null

  /**
   * 脚本运行的抽象，脚本独立于网站、为脚本本身服务的部分
   */
  class Script {
    constructor() {
      /**
       * 通用方法
       */
      this.method = {
        /**
         * GM 读取流程
         *
         * 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
         * @param {string} gmKey 键名
         * @param {*} defaultValue 默认值
         * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
         * @returns {*} 通过校验时是配置值，不能通过校验时是默认值
         */
        gmValidate(gmKey, defaultValue, writeback = true) {
          const value = GM_getValue(gmKey)
          if (Enums && gmKey in Enums) {
            if (Object.values(Enums[gmKey]).indexOf(value) >= 0) {
              return value
            }
          } else if (typeof value == typeof defaultValue) { // typeof null == 'object'，对象默认值赋 null 无需额外处理
            return value
          }

          if (writeback) {
            GM_setValue(gmKey, defaultValue)
          }
          return defaultValue
        },
      }
    }

    /**
     * document-start 级别初始化
     */
    initAtDocumentStart() {
      // document-start 级用户配置读取
      if (gm.configVersion > 0) {
        for (const name of gm.configDocumentStart) {
          gm.config[name] = this.method.gmValidate(name, gm.configMap[name].default)
        }
      } else {
        for (const name of gm.configDocumentStart) {
          gm.config[name] = gm.configMap[name].default
          GM_setValue(name, gm.config[name])
        }
      }
    }

    /**
     * 初始化
     */
    init() {
      try {
        this.initGMObject()
        this.updateVersion()
        this.readConfig()
      } catch (e) {
        api.logger.error(e)
        const result = api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？')
        if (result) {
          const gmKeys = GM_listValues()
          for (const gmKey of gmKeys) {
            GM_deleteValue(gmKey)
          }
          location.reload()
        }
      }
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
      for (const name in gm.configMap) {
        if (gm.configDocumentStart.indexOf(name) < 0) {
          gm.config[name] = gm.configMap[name].default
        }
      }

      gm.data = {
        ...gm.data,
        removeHistoryData: remove => {
          const _ = gm.data._
          if (remove) {
            _.removeHistoryData = undefined
          } else {
            if (_.removeHistoryData === undefined) {
              /** @type {PushQueue} */
              let data = GM_getValue('removeHistoryData')
              if (data && typeof data == 'object') {
                Object.setPrototypeOf(data, PushQueue.prototype) // 还原类型信息
                if (data.maxSize != gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
                }
                if (data.capacity != gm.config.removeHistorySaves) {
                  data.setCapacity(gm.config.removeHistorySaves)
                }
              } else {
                data = new PushQueue(gm.config.removeHistorySaves)
                GM_setValue('removeHistoryData', data)
              }
              _.removeHistoryData = data
            }
            return _.removeHistoryData
          }
        },
        watchlaterListData: async (reload, cache = true, disablePageCache = false) => {
          const _ = gm.data._
          if (_.watchlaterListData === undefined || reload || disablePageCache || gm.config.disablePageCache) {
            if (_.watchlaterListData_loading) {
              // 一旦数据已在加载中，那么直接等待该次加载完成
              // 无论加载成功与否，所有被阻塞的数据请求均都使用该次加载的结果，完全保持一致
              // 注意：加载失败时，返回的空数组并非同一对象
              try {
                return await api.wait.waitForConditionPassed({
                  condition: () => {
                    if (!_.watchlaterListData_loading) {
                      return _.watchlaterListData ?? []
                    }
                  },
                })
              } catch (e) {
                _.watchlaterListData_loading = false
                api.logger.error(e)
                return _.watchlaterListData ?? []
              }
            }

            if (!reload && cache && gm.config.watchlaterListCacheValidPeriod > 0) {
              const cacheTime = GM_getValue('watchlaterListCacheTime')
              if (cacheTime) {
                const current = new Date().getTime()
                if (current - cacheTime < gm.config.watchlaterListCacheValidPeriod * 1000) {
                  const list = GM_getValue('watchlaterListCache')
                  if (list) {
                    _.watchlaterListData = list
                    return list // 默认缓存不为空
                  }
                }
              }
            }

            _.watchlaterListData_loading = true
            try {
              const resp = await api.web.request({
                method: 'GET',
                url: gm.url.api_queryWatchlaterList,
              })
              const json = JSON.parse(resp.responseText)
              const current = json.data.list ?? []
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                const base = item => {
                  return {
                    aid: item.aid,
                    bvid: item.bvid,
                    title: item.title,
                    state: item.state,
                  }
                }
                GM_setValue('watchlaterListCacheTime', new Date().getTime())
                if (gm.config.headerButton && gm.config.headerMenu == Enums.headerMenu.enable) {
                  GM_setValue('watchlaterListCache', current.map(item => {
                    return {
                      ...base(item),
                      pic: item.pic,
                      owner: {
                        mid: item.owner.mid,
                        name: item.owner.name,
                      },
                      progress: item.progress,
                      duration: item.duration,
                      videos: item.videos,
                    }
                  }))
                } else {
                  GM_setValue('watchlaterListCache', current.map(item => base(item)))
                }
              }
              _.watchlaterListData = current
              return current
            } catch (e) {
              api.logger.error(e)
              return _.watchlaterListData ?? []
            } finally {
              _.watchlaterListData_loading = false
            }
          } else {
            return _.watchlaterListData
          }
        },
        _: {}, // 用于存储内部数据，不公开访问
      }

      gm.el = {
        ...gm.el,
        gmRoot: document.body.appendChild(document.createElement('div')),
      }
      gm.el.gmRoot.id = gm.id
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      const _self = this
      if (gm.configVersion > 0) {
        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

          // 4.9.0.20210322
          if (gm.configVersion < 20210322) {
            GM_deleteValue('forceConsistentVideo')
          }

          // 4.11.0a.20210628
          if (gm.configVersion < 20210628) {
            GM_deleteValue('openSettingAfterConfigUpdate')
            // reset everything about history
            GM_deleteValue('removeHistory')
            GM_deleteValue('removeHistorySavePoint')
            GM_deleteValue('removeHistoryFuzzyCompare')
          }

          // 4.11.7.20210701
          if (gm.configVersion < 20210701) {
            const cvp = GM_getValue('watchlaterListCacheValidPeriod')
            if (cvp > 0 && cvp <= 2) {
              GM_setValue('watchlaterListCacheValidPeriod', 5)
            }
          }

          // 4.16.23.20210808
          if (gm.configVersion < 20210808) {
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistoryFuzzyCompareReference')
            GM_deleteValue('removeHistorySaves')
            GM_deleteValue('removeHistorySearchTimes')
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 4.17.0.20210808
          if (gm.configVersion < 20210808.1) {
            GM_deleteValue('hideWatchlaterInCollect')
          }

          // 4.17.4.20210810
          if (gm.configVersion < 20210810.1) {
            GM_deleteValue('fixHeader')
          }

          // 功能性更新后更新此处配置版本
          if (gm.configVersion < 20210810.1) {
            _self.openUserSetting(2)
          } else {
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
          }
        }
      }
    }

    /**
     * 用户配置读取
     */
    readConfig() {
      const _self = this
      if (gm.configVersion > 0) {
        // 对配置进行校验
        for (const name in gm.config) {
          if (gm.configDocumentStart.indexOf(name) < 0) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name])
          }
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        for (const name in gm.config) {
          if (gm.configDocumentStart.indexOf(name) < 0) {
            GM_setValue(name, gm.config[name])
          }
        }
        _self.openUserSetting(1)
      }
    }

    /**
     * 添加脚本菜单
     */
    addScriptMenu() {
      const _self = this
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => _self.openUserSetting())
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', () => _self.openRemoveHistory()) // 注意不要直接传函数对象，否则 this 不对
        // 清空稍后再看历史数据
        GM_registerMenuCommand('清空稍后再看历史数据', () => _self.cleanRemoveHistoryData())
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => _self.resetScript())
    }

    /**
     * 打开用户设置
     * @param {number} [type=0] 普通 `0` | 初始化 `1` | 功能性更新 `2`
     */
    openUserSetting(type = 0) {
      const _self = this
      if (gm.el.setting) {
        _self.openMenuItem('setting')
      } else {
        const el = {}
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          _self.openMenuItem('setting')
        })

        /**
         * 设置页初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          if (gm.config.hideDisabledSubitems) {
            gm.el.setting.className = 'gm-setting gm-hideDisabledSubitems'
          } else {
            gm.el.setting.className = 'gm-setting'
          }
          gm.el.setting.innerHTML = `
            <div id="gm-setting-page">
              <div class="gm-title">
                <div id="gm-maintitle" title="${GM_info.script.homepage}">
                  <a href="${GM_info.script.homepage}" target="_blank">${GM_info.script.name}</a>
                </div>
                <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
              </div>
              <div class="gm-items">
                <table>
                  <tr class="gm-item" title="在顶栏「动态」和「收藏」之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置。">
                    <td rowspan="12"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>在顶栏中加入稍后再看入口</span>
                        <input id="gm-headerButton" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择左键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标左键时</span>
                        <select id="gm-headerButtonOpL"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择右键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标右键时</span>
                        <select id="gm-headerButtonOpR"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择中键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标中键时</span>
                        <select id="gm-headerButtonOpM"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="设置入口弹出菜单。">
                    <td>
                      <div>
                        <span>将鼠标移动至入口上方时</span>
                        <select id="gm-headerMenu">
                          <option value="${Enums.headerMenu.enable}">弹出稍后再看列表</option>
                          <option value="${Enums.headerMenu.enableSimple}">弹出简化的稍后再看列表</option>
                          <option value="${Enums.headerMenu.disable}">不执行操作</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择在弹出菜单中点击链接的行为。">
                    <td>
                      <div>
                        <span>在弹出菜单中点击链接时</span>
                        <select id="gm-openHeaderMenuLink">
                          <option value="${Enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                          <option value="${Enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单中显示自页面打开以来，从弹出菜单移除的视频。">
                    <td>
                      <label>
                        <span>在弹出菜单中显示被移除的视频</span>
                        <input id="gm-headerMenuKeepRemoved" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单顶部显示搜索框。">
                    <td>
                      <label>
                        <span>在弹出菜单顶部显示搜索框</span>
                        <input id="gm-headerMenuSearch" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单底部显示排序控制器。">
                    <td>
                      <label>
                        <span>在弹出菜单底部显示排序控制器</span>
                        <input id="gm-headerMenuSortControl" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单底部显示自动移除控制器。">
                    <td>
                      <label>
                        <span>在弹出菜单底部显示自动移除控制器</span>
                        <input id="gm-headerMenuAutoRemoveControl" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="设置在弹出列表显示的快捷功能。">
                    <td>
                      <div class="gm-lineitems">
                        <span>在弹出菜单底部显示：</span>
                        <label class="gm-lineitem">
                          <span>设置</span><input id="gm-headerMenuFnSetting" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>历史</span><input id="gm-headerMenuFnHistory" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>清空</span><input id="gm-headerMenuFnRemoveAll" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>移除已看</span><input id="gm-headerMenuFnRemoveWatched" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>显示</span><input id="gm-headerMenuFnShowAll" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>播放</span><input id="gm-headerMenuFnPlayAll" type="checkbox">
                        </label>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！若列表中没有提供您需要的第三方顶栏，且该第三方顶栏有一定用户基数，可在脚本反馈页发起请求。">
                    <td>
                      <div>
                        <span>兼容第三方顶栏：</span>
                        <select id="gm-headerCompatible">
                          <option value="${Enums.headerCompatible.none}">无</option>
                          <option value="${Enums.headerCompatible.bilibiliEvolved}">Bilibili Evolved</option>
                        </select>
                        <span id="gm-hcWarning" class="gm-warning gm-trailing" title>⚠</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="保留稍后再看列表中的数据，以查找出一段时间内将哪些视频移除出稍后再看，用于拯救误删操作。关闭该选项会将内部历史数据清除！">
                    <td rowspan="6"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>开启稍后再看移除记录</span>
                        <input id="gm-removeHistory" type="checkbox">
                        <span id="gm-rhWarning" class="gm-warning" title>⚠</span>
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="选择在何时保存稍后再看历史数据。无论选择哪一种方式，在同一个 URL 对应的页面下至多触发一次保存。">
                      <td>
                        <div>
                          <span>为了生成移除记录，</span>
                          <select id="gm-removeHistorySavePoint">
                            <option value="${Enums.removeHistorySavePoint.list}">在打开列表页面时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.listAndMenu}">在打开列表页面或弹出入口菜单时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.anypage}">在打开任意相关页面时保存数据</option>
                          </select>
                          <span id="gm-rhspInformation" class="gm-information" title>💬</span>
                        </div>
                      </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="设置模糊比对深度以快速舍弃重复数据从而降低开销，但可能会造成部分记录遗漏。">
                    <td>
                      <div>
                        <span>模糊比对模式深度</span>
                        <span id="gm-rhfcInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryFuzzyCompare" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="较大的数值可能会带来较大的开销（具体参考右侧弹出说明）。将该项修改为比原来小的值会清理过期数据，无法恢复！">
                    <td>
                      <div>
                        <span>不重复数据记录保存数</span>
                        <span id="gm-rhsInformation" class="gm-information" title>💬</span>
                        <span id="gm-cleanRemoveHistoryData" class="gm-info" title="清理已保存的稍后再看历史数据，不可恢复！">清空数据(0条)</span>
                        <input id="gm-removeHistorySaves" type="text">
                        <span id="gm-rhsWarning" class="gm-warning" title>⚠</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="在稍后再看历史数据记录中保存时间戳，以其优化对数据记录的排序及展示。">
                    <td>
                      <label>
                        <span>使用时间戳优化移除记录</span>
                        <span id="gm-rhtInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryTimestamp" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="搜寻时在最近多少条数据记录中查找，设置较小的值能较好地定位最近被添加到稍后再看的视频。">
                    <td>
                      <div>
                        <span>默认历史回溯深度</span>
                        <input id="gm-removeHistorySearchTimes" type="text">
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="填充默认情况下缺失的稍后再看状态信息。">
                    <td><div>全局功能</div></td>
                    <td>
                      <div>
                        <span>填充缺失的稍后再看状态信息：</span>
                        <select id="gm-fillWatchlaterStatus">
                          <option value="${Enums.fillWatchlaterStatus.dynamic}">仅动态页面</option>
                          <option value="${Enums.fillWatchlaterStatus.dynamicAndVideo}">仅动态和视频播放页面</option>
                          <option value="${Enums.fillWatchlaterStatus.anypage}">所有页面</option>
                          <option value="${Enums.fillWatchlaterStatus.never}">禁用功能</option>
                        </select>
                        <span id="gm-fwsInformation" class="gm-information" title>💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="决定首次打开列表页面或顶栏入口弹出菜单时，如何对稍后再看列表内容进行排序。">
                    <td><div>全局功能</div></td>
                    <td>
                      <div>
                        <span>自动排序：</span>
                        <select id="gm-autoSort">
                          <option value="${Enums.autoSort.auto}">使用上一次排序控制器的选择</option>
                          <option value="${Enums.autoSort.default}">禁用功能</option>
                          <option value="${Enums.autoSort.defaultR}">固定使用 [ 默认↓ ] 排序</option>
                          <option value="${Enums.autoSort.duration}">固定使用 [ 时长 ] 排序</option>
                          <option value="${Enums.autoSort.durationR}">固定使用 [ 时长↓ ] 排序</option>
                          <option value="${Enums.autoSort.progress}">固定使用 [ 进度 ] 排序</option>
                          <option value="${Enums.autoSort.uploader}">固定使用 [ UP 主 ] 排序</option>
                          <option value="${Enums.autoSort.title}">固定使用 [ 标题 ] 排序</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在播放页面（包括普通模式和稍后再看模式）中加入能将视频快速切换添加或移除出稍后再看列表的按钮。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>加入快速切换视频稍后再看状态的按钮</span>
                        <input id="gm-videoButton" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开播放页面时，自动将视频从稍后再看列表中移除，或在特定条件下执行自动移除。">
                    <td><div>播放页面</div></td>
                    <td>
                      <div>
                        <span>打开页面时，</span>
                        <select id="gm-autoRemove">
                          <option value="${Enums.autoRemove.always}">若视频在稍后再看中，则移除出稍后再看</option>
                          <option value="${Enums.autoRemove.openFromList}">若是从列表页面或弹出菜单列表点击进入，则移除出稍后再看</option>
                          <option value="${Enums.autoRemove.never}">不执行自动移除功能，但可临时开启功能</option>
                          <option value="${Enums.autoRemove.absoluteNever}">彻底禁用自动移除功能</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开「${gm.url.page_videoWatchlaterMode}」页面时，自动切换至「${gm.url.page_videoNormalMode}」页面进行播放，但不影响「播放全部」等相关功能。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>从稍后再看模式强制切换到普通模式播放（重定向）</span>
                        <input id="gm-redirect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在列表页面显示搜索框。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示搜索框</span>
                        <input id="gm-listSearch" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在列表页面显示排序控制器。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示排序控制器</span>
                        <input id="gm-listSortControl" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="设置在「${gm.url.page_watchlaterList}」页面点击视频时的行为。">
                    <td><div>列表页面</div></td>
                    <td>
                      <div>
                        <span>点击视频时</span>
                        <select id="gm-openListVideo">
                          <option value="${Enums.openListVideo.openInCurrent}">在当前页面打开</option>
                          <option value="${Enums.openListVideo.openInNew}">在新标签页打开</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除「一键清空」按钮</span>
                        <input id="gm-removeButton_removeAll" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除「移除已观看视频」按钮</span>
                        <input id="gm-removeButton_removeWatched" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="安装固顶官方顶栏的用户样式（建议使用 Stylus 安装）。">
                    <td><div>相关调整</div></td>
                    <td>
                      <div>
                        <span>将顶栏固定在页面顶部</span>
                        <a id="gm-fixHeader" class="gm-info" href="${gm.url.external_fixHeader}" target="_blank"">安装功能</a>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="对顶栏各入口弹出菜单中滚动条的样式进行设置。">
                    <td><div>相关调整</div></td>
                    <td>
                      <div>
                        <span>对于弹出菜单中的滚动条</span>
                        <select id="gm-menuScrollbarSetting">
                          <option value="${Enums.menuScrollbarSetting.beautify}">修改其外观为现代风格</option>
                          <option value="${Enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                          <option value="${Enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="隐藏顶栏「收藏」入口弹出菜单中的「稍后再看」。">
                    <td><div>相关调整</div></td>
                    <td>
                      <label>
                        <span>隐藏「收藏」中的「稍后再看」</span>
                        <input id="gm-hideWatchlaterInCollect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="选择脚本主要逻辑的运行时期。">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>脚本运行时期：</span>
                        <select id="gm-mainRunAt">
                          <option value="${Enums.mainRunAt.DOMContentLoaded}">DOMContentLoaded</option>
                          <option value="${Enums.mainRunAt.load}">load</option>
                        </select>
                        <span id="gm-mraInformation" class="gm-information" title>💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="禁用页面缓存">
                    <td><div>脚本设置</div></td>
                    <td>
                      <label>
                        <span>禁用页面缓存</span>
                        <span id="gm-dpcInformation" class="gm-information" title>💬</span>
                        <input id="gm-disablePageCache" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="稍后再看列表数据本地缓存有效期（单位：秒）">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>稍后再看列表数据本地缓存有效期（单位：秒）</span>
                        <span id="gm-wlcvpInformation" class="gm-information" title>💬</span>
                        <input id="gm-watchlaterListCacheValidPeriod" type="text">
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="一般情况下，是否在用户设置中隐藏被禁用项的子项？">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>一般情况下隐藏被禁用项的子项</span>
                        <input id="gm-hideDisabledSubitems" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="勾选后，如果更改的配置需要重新加载才能生效，那么会在设置完成后重新加载页面。">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>必要时在设置完成后重新加载页面</span>
                        <input id="gm-reloadAfterSetting" type="checkbox">
                      </label>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="gm-bottom">
                <button id="gm-save">保存</button>
                <button id="gm-cancel">取消</button>
              </div>
              <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。该操作不会清除已保存的稍后再看历史数据，因此不会导致移除记录丢失。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a id="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in { ...gm.configMap, ...gm.infoMap }) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('#gm-setting-page')
          el.items = gm.el.setting.querySelector('.gm-items')
          el.maintitle = gm.el.setting.querySelector('#gm-maintitle')
          el.changelog = gm.el.setting.querySelector('#gm-changelog')
          switch (type) {
            case 1:
              el.settingPage.setAttribute('setting-type', 'init')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(初始化设置)</span>'
              break
            case 2:
              el.settingPage.setAttribute('setting-type', 'updated')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(功能性更新设置)</span>'
              {
                (function(map) {
                  for (const name in map) {
                    const configVersion = map[name].configVersion
                    if (configVersion && configVersion > gm.configVersion) {
                      let element = el[name]
                      while (element.nodeName != 'TD') {
                        element = element.parentElement
                        if (!element) break
                      }
                      if (element?.firstElementChild) {
                        api.dom.addClass(element.firstElementChild, 'gm-updated')
                      }
                    }
                  }
                })({ ...gm.configMap, ...gm.infoMap })
              }
              break
          }
          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')

          // 提示信息
          el.rhspInformation = gm.el.setting.querySelector('#gm-rhspInformation')
          api.message.advanced(el.rhspInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>选择更多保存时间点能提高移除历史的准确度，但可能会伴随大量无意义的数据比较。无论选择哪一种方式，在同一个 URL 对应的页面下至多保存一次。</p>
              <p>若习惯于从稍后再看列表页面点击视频观看，建议选择第一项或第二项。若习惯于直接在顶栏弹出菜单中点击视频观看，请选择第二项。第三项性价比低，不推荐选择。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhspInformation.parentElement.hasAttribute('disabled') })
          el.rhfcInformation = gm.el.setting.querySelector('#gm-rhfcInformation')
          api.message.advanced(el.rhfcInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>模糊比对模式：设当前时间点获取到的稍后再看列表数据为 A，上一次获取到的数据为 B。若 A 与 B 的前 <b>N</b> 项均一致就认为这段时间没有往稍后再看中添加新视频，直接跳过后续处理。</p>
              <p>其中，<b>N</b> 即为模糊比对深度。注意，<b>深度设置过大反而会降低比对效率</b>，建议先设置较小的值，若后续观察到有记录被误丢弃，再增加该项的值。最佳参数与个人使用习惯相关，请根据自身情况微调。你也可以选择设置 <b>0</b> 以关闭模糊比对模式（不推荐）。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhfcInformation.parentElement.hasAttribute('disabled') })
          el.rhsInformation = gm.el.setting.querySelector('#gm-rhsInformation')
          api.message.advanced(el.rhsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在脚本限制的取值范围内，稍后再看历史数据的保存与读取对页面加载的影响几乎可以忽略不计（小于 1ms，不含脚本管理器对数据进行预加载的时间）。</p>
              <p>但是打开移除记录时，根据大量数据生成历史的过程较为耗时。不过，只要将「默认历史回溯深度」设置在 100 以下就不会有明显的生成延迟。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhsInformation.parentElement.hasAttribute('disabled') })
          el.rhtInformation = gm.el.setting.querySelector('#gm-rhtInformation')
          api.message.advanced(el.rhtInformation, `
            <div style="line-height:1.6em">
              在历史数据记录中添加时间戳，用于改善移除记录中的数据排序，使得排序以「视频『最后一次』被观察到处于稍后再看的时间点」为基准，而非以「视频『第一次』被观察到处于稍后再看的时间点」为基准；同时也利于数据展示与查看。注意，此功能在数据存读及处理上都有额外开销。
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhtInformation.parentElement.hasAttribute('disabled') })
          el.fwsInformation = gm.el.setting.querySelector('#gm-fwsInformation')
          api.message.advanced(el.fwsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在动态页、视频播放页以及其他页面，视频卡片的右下角方存在一个将视频加入或移除出稍后再看的快捷按钮。然而，在刷新页面后，B站不会为之加载稍后再看的状态——即使视频已经在稍后再看中，也不会显示出来。启用该功能后，会自动填充这些缺失的状态信息。</p>
              <p>第三项「所有页面」，会用一套固定的逻辑对脚本能匹配到的所有非特殊页面尝试进行信息填充。脚本本身没有匹配所有B站页面，如果有需要，请在脚本管理器（如 Tampermonkey）中为脚本设置额外的页面匹配规则。由于B站各页面的设计不是很规范，某些页面中视频卡片的设计可能跟其他地方不一致，所以不保证必定能填充成功。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.mraInformation = gm.el.setting.querySelector('#gm-mraInformation')
          api.message.advanced(el.mraInformation, `
            <div style="line-height:1.6em">
              <p style="margin-bottom:0.5em"><b>DOMContentLoaded</b>：与页面内容同步加载，避免脚本在页面加载度较高时才对页面作修改。上述情况会给人页面加载时间过长的错觉，并且伴随页面变化突兀的不适感。</p>
              <p><b>load</b>：在页面初步加载完成时运行。从理论上来说这个时间点更为合适，且能保证脚本在网页加载速度极慢时仍可正常工作。但要注意的是，以上所说「网页加载速度极慢」的情况并不常见，以下为常见原因：1. 短时间内（在后台）打开十几乃至数十个网页；2. 网络问题。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.dpcInformation = gm.el.setting.querySelector('#gm-dpcInformation')
          api.message.advanced(el.dpcInformation, `
            <div style="line-height:1.6em">
              <p>部分情况下，在同一个页面中，若一份数据之前已经获取过，则使用页面中缓存的数据。当然，这种情况对数据的实时性没有要求，不建议禁用页面缓存。注意，启用该项不会禁用本地缓存。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.wlcvpInformation = gm.el.setting.querySelector('#gm-wlcvpInformation')
          api.message.advanced(el.wlcvpInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在本地缓存的有效期内脚本将会使用本地缓存来代替网络请求，除非是在有必要确保数据正确性的场合。设置为 <b>0</b> 可以禁止使用本地缓存。</p>
              <p>本地缓存无法确保数据的正确性，设置过长时甚至可能导致各种诡异的现象。请根据个人需要将本地缓存有效期设置为一个合理的值。</p>
              <p>不推荐设置为 0 将其完全禁用，而是设置为一个较小值（如 5）。这样几乎不会影响正确性，同时避免大量无意义的网络请求。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })

          el.hcWarning = gm.el.setting.querySelector('#gm-hcWarning')
          api.message.advanced(el.hcWarning, '无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！', '⚠')
          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          api.message.advanced(el.rhWarning, '关闭移除记录，或将稍后再看历史数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！', '⚠')
          el.rhsWarning = gm.el.setting.querySelector('#gm-rhsWarning')
          api.message.advanced(el.rhsWarning, `该项设置过大时，在极端情况下可能会造成明显的卡顿，一般不建议该项超过 ${gm.const.rhsWarning}（详见弹出说明）。当然，如果对机器性能自信，可以无视该警告。`, '⚠')

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = el.headerButtonOpM.innerHTML = `
            <option value="${Enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
            <option value="${Enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
            <option value="${Enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
            <option value="${Enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
            <option value="${Enums.headerButtonOp.clearWatchlater}">清空稍后再看</option>
            <option value="${Enums.headerButtonOp.clearWatchedInWatchlater}">移除稍后再看已观看视频</option>
            <option value="${Enums.headerButtonOp.openUserSetting}">打开用户设置</option>
            <option value="${Enums.headerButtonOp.openRemoveHistory}">打开稍后再看移除记录</option>
            <option value="${Enums.headerButtonOp.noOperation}">不执行操作</option>
          `
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        const processConfigItem = () => {
          // 子项与父项相关联
          const subitemChange = (item, sup) => {
            const subitems = el.items.querySelectorAll(`[sup="${sup}"]`)
            for (const subitem of subitems) {
              subitem.querySelectorAll('[id|=gm]').forEach(option => {
                const parent = option.parentElement
                if (item.checked) {
                  parent.removeAttribute('disabled')
                } else {
                  parent.setAttribute('disabled', '')
                }
                option.disabled = !item.checked
              })
            }
          }
          el.headerMenuFn = el.headerMenuFnSetting.parentElement.parentElement
          el.headerButton.init = function() {
            subitemChange(this, 'headerButton')
            if (this.checked) {
              el.headerMenuFn.removeAttribute('disabled')
            } else {
              el.headerMenuFn.setAttribute('disabled', '')
            }
          }
          el.headerButton.onchange = function() {
            this.init()
            if (gm.config.hideDisabledSubitems) {
              api.dom.setAbsoluteCenter(el.settingPage)
            }
          }
          el.headerCompatible.init = el.headerCompatible.onchange = function() {
            setHcWarning()
          }
          el.removeHistory.init = function() {
            subitemChange(this, 'removeHistory')
            setRhWaring()
          }
          el.removeHistory.onchange = function() {
            this.init()
            if (gm.config.hideDisabledSubitems) {
              api.dom.setAbsoluteCenter(el.settingPage)
            }
          }

          // 输入框内容处理
          el.removeHistoryFuzzyCompare.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistoryFuzzyCompare.max) {
                value = gm.configMap.removeHistoryFuzzyCompare.max
              }
              this.value = value
            }
          }
          el.removeHistoryFuzzyCompare.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistoryFuzzyCompare.default
            }
          }

          el.removeHistorySaves.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistorySaves.max) {
                value = gm.configMap.removeHistorySaves.max
              }
              this.value = value
            }
            setRhWaring()
            setRhsWarning()
          }
          el.removeHistorySaves.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistorySaves.default
            } else {
              let value = parseInt(this.value)
              if (value < gm.configMap.removeHistorySaves.min) {
                value = gm.configMap.removeHistorySaves.min
              }
              this.value = value
            }
            setRhWaring()
            setRhsWarning()
          }

          el.removeHistorySearchTimes.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistorySearchTimes.max) {
                value = gm.configMap.removeHistorySearchTimes.max
              }
              this.value = value
            }
          }
          el.removeHistorySearchTimes.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistorySearchTimes.default
            } else {
              let value = parseInt(this.value)
              if (value < gm.configMap.removeHistorySearchTimes.min) {
                value = gm.configMap.removeHistorySearchTimes.min
              }
              this.value = value
            }
          }

          el.watchlaterListCacheValidPeriod.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.watchlaterListCacheValidPeriod.max) {
                value = gm.configMap.watchlaterListCacheValidPeriod.max
              }
              this.value = value
            }
          }
          el.watchlaterListCacheValidPeriod.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.watchlaterListCacheValidPeriod.default
            }
          }
        }

        /**
         * 处理与设置页相关的数据和元素
         */
        const processSettingItem = () => {
          const _self = this
          gm.menu.setting.openHandler = onOpen
          gm.menu.setting.openedHandler = onOpened
          el.save.onclick = onSave
          el.cancel.onclick = () => _self.closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          }
          el.reset.onclick = () => _self.resetScript()
          el.cleanRemoveHistoryData.onclick = function() {
            el.removeHistory.checked && _self.cleanRemoveHistoryData()
          }
          if (type > 0) {
            if (type == 2) {
              el.save.title = '向下滚动……'
              el.save.disabled = true
            }
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', '')
          }
        }

        let needReload = false
        /**
         * 设置保存时执行
         */
        const onSave = () => {
          // 预处理
          if (gm.config.headerButton != el.headerButton.checked) {
            // 会引起 headerMenu 生效或失效
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 通用处理
          for (const name in gm.configMap) {
            const cfg = gm.configMap[name]
            if (!cfg.manual) {
              const change = saveConfig(name, cfg.attr)
              if (!cfg.needNotReload) {
                needReload = needReload || change
              }
            }
          }

          // 特殊处理
          if (gm.config.headerMenu != el.headerMenu.value) {
            gm.config.headerMenu = el.headerMenu.value
            GM_setValue('headerMenu', gm.config.headerMenu)
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
            needReload = true
          }
          let shutDownRemoveHistory = false
          // removeHistory
          if (gm.config.removeHistory != el.removeHistory.checked) {
            gm.config.removeHistory = el.removeHistory.checked
            GM_setValue('removeHistory', gm.config.removeHistory)
            shutDownRemoveHistory = true
            needReload = true
          }
          // 「因」中无 removeHistory，就说明 needReload 需要设置为 true，除非「果」不需要刷新页面就能生效
          if (gm.config.removeHistory) {
            const rhsV = parseInt(el.removeHistorySaves.value)
            if (rhsV != gm.config.removeHistorySaves && !isNaN(rhsV)) {
              // 因：removeHistorySaves
              // 果：removeHistorySaves & removeHistoryData
              const data = gm.data.removeHistoryData()
              data.setMaxSize(rhsV)
              data.setCapacity(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', rhsV)
              GM_setValue('removeHistoryData', data)
              // 不需要修改 needReload
            }
            // 因：removeHistorySearchTimes
            // 果：removeHistorySearchTimes
            const rhstV = parseInt(el.removeHistorySearchTimes.value)
            if (rhstV != gm.config.removeHistorySearchTimes && !isNaN(rhstV)) {
              gm.config.removeHistorySearchTimes = rhstV
              GM_setValue('removeHistorySearchTimes', rhstV)
              // 不需要修改 needReload
            }
          } else if (shutDownRemoveHistory) {
            // 因：removeHistory
            // 果：most thing about history
            gm.data.removeHistoryData(true)
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistoryFuzzyCompare')
            GM_deleteValue('removeHistoryFuzzyCompareReference')
            GM_deleteValue('removeHistorySaves')
          }

          _self.closeMenuItem('setting')
          if (type > 0) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭特殊状态
            setTimeout(() => {
              el.settingPage.removeAttribute('setting-type')
              el.maintitle.textContent = GM_info.script.name
              el.cancel.disabled = false
              el.shadow.removeAttribute('disabled')
            }, gm.const.fadeTime)
          }

          if (gm.config.reloadAfterSetting && needReload) {
            needReload = false
            location.reload()
          }
        }

        /**
         * 设置打开时执行
         */
        const onOpen = () => {
          for (const name in gm.configMap) {
            const attr = gm.configMap[name].attr
            el[name][attr] = gm.config[name]
          }
          for (const name in gm.configMap) {
            // 需要等所有配置读取完成后再进行选项初始化
            el[name].init?.()
          }
          if (gm.config.removeHistory) {
            el.cleanRemoveHistoryData.textContent = `清空数据(${gm.data.removeHistoryData().size}条)`
          } else {
            el.cleanRemoveHistoryData.textContent = '清空数据(0条)'
          }
          el.settingPage.parentElement.style.display = 'block'
          api.dom.setAbsoluteCenter(el.settingPage)
          el.items.scrollTop = 0
        }

        /**
         * 设置打开后执行
         */
        const onOpened = () => {
          if (type == 2) {
            const resetSave = () => {
              el.save.title = ''
              el.save.disabled = false
            }

            const points = []
            const totalLength = el.items.firstElementChild.offsetHeight
            const items = el.items.querySelectorAll('.gm-updated')
            for (const item of items) {
              const tr = item.parentElement.parentElement
              points.push(tr.offsetTop / totalLength * 100)
            }

            if (points.length > 0) {
              let range = 5 // 显示宽度
              const actualRange = items[0].parentElement.parentElement.offsetHeight / totalLength * 100 // 实际宽度
              let realRange = actualRange // 校正后原点到真实末尾的宽度
              if (actualRange > range) {
                range = actualRange
              } else {
                const offset = (actualRange - range) / 2
                for (let i = 0; i < points.length; i++) {
                  points[i] = points[i] + offset
                }
                realRange = range + offset
              }
              const start = []
              const end = []
              let currentStart = points[0]
              let currentEnd = points[0] + range
              for (let i = 1; i < points.length; i++) {
                const point = points[i]
                if (point < currentEnd) {
                  currentEnd = point + range
                } else {
                  start.push(currentStart)
                  end.push(currentEnd)
                  currentStart = point
                  currentEnd = point + range
                  if (currentEnd >= 100) {
                    currentEnd = 100
                    break
                  }
                }
              }
              start.push(currentStart)
              end.push(currentEnd)

              let linear = ''
              for (let i = 0; i < start.length; i++) {
                linear += `, transparent ${start[i]}%, ${gm.const.updateHighlightColor} ${start[i]}%, ${gm.const.updateHighlightColor} ${end[i]}%, transparent ${end[i]}%`
              }
              linear = linear.slice(2)

              api.dom.addStyle(`
                #${gm.id} [setting-type=updated] .gm-items::-webkit-scrollbar {
                  background: linear-gradient(${linear})
                }
              `)

              if (el.items.scrollHeight == el.items.clientHeight) {
                resetSave()
              } else {
                const last = Math.min((points.pop() + realRange) / 100, 0.95) // 给计算误差留点余地
                const onScroll = api.tool.throttle(function() {
                  const bottom = (this.scrollTop + this.clientHeight) / this.scrollHeight
                  if (bottom > last) { // 可视区底部超过最后一个更新点
                    resetSave()
                    this.removeEventListener('scroll', onScroll)
                  }
                }, 200)
                el.items.addEventListener('scroll', onScroll)
              }
            } else {
              resetSave()
            }
          }
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        const saveConfig = (name, attr) => {
          let val = el[name][attr]
          const type = gm.configMap[name].type
          if (type == 'int' || type == 'float') {
            if (typeof val != 'number') {
              val = type == 'int' ? parseInt(val) : parseFloat(val)
            }
            if (isNaN(val)) {
              val = gm.configMap[name].default
            }
          }
          if (gm.config[name] != val) {
            gm.config[name] = val
            GM_setValue(name, gm.config[name])
            return true
          }
          return false
        }

        /**
         * 设置 headerCompatible 警告项
         */
        const setHcWarning = () => {
          const warn = el.headerCompatible.value != Enums.headerCompatible.none
          if (el.hcWarning.show) {
            if (!warn) {
              api.dom.fade(false, el.hcWarning)
              el.hcWarning.show = false
            }
          } else {
            if (warn) {
              api.dom.fade(true, el.hcWarning)
              el.hcWarning.show = true
            }
          }
        }

        /**
         * 设置 removeHistory 警告项
         */
        const setRhWaring = () => {
          let warn = false
          const rh = el.removeHistory.checked
          if (!rh && gm.config.removeHistory) {
            warn = true
          } else {
            let rhs = parseInt(el.removeHistorySaves.value)
            if (isNaN(rhs)) {
              rhs = 0
            }
            if (rhs < gm.config.removeHistorySaves && gm.config.removeHistory) {
              warn = true
            }
          }

          if (el.rhWarning.show) {
            if (!warn) {
              api.dom.fade(false, el.rhWarning)
              el.rhWarning.show = false
            }
          } else {
            if (warn) {
              api.dom.fade(true, el.rhWarning)
              el.rhWarning.show = true
            }
          }
        }

        /**
         * 设置 removeHistorySaves 警告项
         */
        const setRhsWarning = () => {
          let value = parseInt(el.removeHistorySaves.value)
          if (isNaN(value)) {
            value = 0
          }
          if (el.rhsWarning.show) {
            if (value <= gm.const.rhsWarning) {
              api.dom.fade(false, el.rhsWarning)
              el.rhsWarning.show = false
            }
          } else {
            if (value > gm.const.rhsWarning) {
              api.dom.fade(true, el.rhsWarning)
              el.rhsWarning.show = true
            }
          }
        }
      }
    }

    /**
     * 打开移除记录
     */
    openRemoveHistory() {
      const _self = this
      if (!gm.config.removeHistory) {
        api.message.create('请在设置中开启稍后再看移除记录')
        return
      }

      const el = {}
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes
        el.searchTimes.value = el.searchTimes.current

        el.historySort = gm.el.history.querySelector('#gm-history-sort')
        if (el.historySort.type !== 0) {
          el.historySort.setType(0) // 倒序
        }

        _self.openMenuItem('history')
      } else {
        setTimeout(() => {
          initHistory()
          processItem()
          _self.openMenuItem('history')
        })

        /**
         * 初始化移除记录页面
         */
        const initHistory = () => {
          gm.el.history = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.history.el = gm.el.history
          gm.el.history.className = 'gm-history'
          gm.el.history.innerHTML = `
            <div class="gm-history-page">
              <div class="gm-title">稍后再看移除记录</div>
              <div class="gm-comment">
                <div>根据最近<span id="gm-save-times">0</span>条不重复数据记录生成，共筛选出<span id="gm-removed-num">0</span>条移除记录。排序由视频<span id="gm-history-time-point"></span>被观察到处于稍后再看的时间决定，与被移除出稍后再看的时间无关。如果记录太少请在下方设置增加历史回溯深度；记录太多则减少之，并善用浏览器的搜索功能辅助定位。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
                <div style="text-align:right;font-weight:bold">
                  <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer">倒序</span>
                  <span title="搜寻时在最近保存的多少条稍后再看历史数据记录中查找。按下回车键或输入框失去焦点时刷新数据，设置较小的值能较好地定位最近被添加到稍后再看的视频。">历史回溯深度：<input type="text" id="gm-search-times" value="0"></span>
                </div>
              </div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.historyPage = gm.el.history.querySelector('.gm-history-page')
          el.comment = gm.el.history.querySelector('.gm-comment')
          el.content = null
          el.timePoint = gm.el.history.querySelector('#gm-history-time-point')
          el.saveTimes = gm.el.history.querySelector('#gm-save-times')
          el.removedNum = gm.el.history.querySelector('#gm-removed-num')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          // 使用 el.searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.searchTimes.current = gm.config.removeHistorySearchTimes
          el.searchTimes.value = el.searchTimes.current
          const stMin = gm.configMap.removeHistorySearchTimes.min
          el.searchTimes.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              const stMax = gm.configMap.removeHistorySearchTimes.max
              let value = parseInt(v0)
              if (value > stMax) {
                value = stMax
              } else if (value < stMin) {
                value = stMin
              }
              this.value = value
            }
          }
          el.searchTimes.onblur = function() {
            if (this.value === '') {
              this.value = gm.config.removeHistorySearchTimes
            }
            if (this.value != el.searchTimes.current) {
              el.searchTimes.current = this.value
              gm.menu.history.openHandler()
            }
          }
          el.searchTimes.onkeyup = function(e) {
            if (e.keyCode == 13) {
              this.onblur()
            }
          }

          // 排序方式
          el.historySort = gm.el.history.querySelector('#gm-history-sort')
          el.historySort.type = 0
          el.historySort.typeText = ['降序', '升序', '完全升序']
          el.historySort.title = '点击切换升序'
          el.historySort.setType = function(type) {
            this.type = type
            this.textContent = this.typeText[type]
            this.title = `点击切换${this.typeText[(type + 1) % this.typeText.length]}`
          }
          el.historySort.onclick = function() {
            this.setType((this.type + 1) % this.typeText.length)
            gm.menu.history.openHandler()
          }

          gm.menu.history.openHandler = onOpen
          window.addEventListener('resize', api.tool.throttle(setContentTop, 100))
          el.shadow.onclick = () => _self.closeMenuItem('history')
        }

        /**
         * 移除记录打开时执行
         */
        const onOpen = async () => {
          if (el.content) {
            const oldContent = el.content
            oldContent.fadeOutTime = gm.const.textFadeTime
            api.dom.fade(false, oldContent, () => oldContent.remove())
          }
          el.content = el.historyPage.appendChild(document.createElement('div'))
          el.content.className = 'gm-content'
          el.timePoint.textContent = gm.config.removeHistoryTimestamp ? '最后一次' : '第一次'
          el.historyPage.parentElement.style.display = 'block'
          api.dom.setAbsoluteCenter(el.historyPage)

          try {
            const map = await webpage.method.getWatchlaterDataMap(item => item.bvid, null, true)
            const depth = parseInt(el.searchTimes.current)
            let data = null
            if (el.historySort.type < 2) {
              data = gm.data.removeHistoryData().toArray(depth)
            } else {
              const rhd = gm.data.removeHistoryData()
              data = rhd.toArray(depth, rhd.size - depth)
            }
            el.saveTimes.textContent = data.length
            let history = []
            const result = []
            for (const record of data) {
              if (!map.has(record[0])) {
                history.push(record)
              }
            }
            if (gm.config.removeHistoryTimestamp) {
              // 万恶的标准并没有对 Array.prototype.sort() 的稳定性作规定
              // 尽管目前 Chromium 上的 sort() 似乎是稳定排序，但还是手动处理一下吧
              const tsMap = new Map()
              for (let i = 0; i < history.length; i++) {
                const ts = history[i][2] ?? 0
                if (tsMap.has(ts)) {
                  const ar = tsMap.get(ts)
                  ar.push(history[i])
                } else {
                  const ar = []
                  ar.push(history[i])
                  tsMap.set(ts, ar)
                }
              }
              const tsIdx = Array.from(tsMap.keys())
              tsIdx.sort()
              history = []
              if (el.historySort.type < 1) {
                for (let i = tsIdx.length - 1; i >= 0; i--) {
                  history = history.concat(tsMap.get(tsIdx[i]))
                }
              } else {
                for (let i = 0; i < tsIdx.length; i++) {
                  history = history.concat(tsMap.get(tsIdx[i]).reverse())
                }
              }

              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" bvid="${rm[0]}">
                    ${rm[2] ? `<div class="gm-history-date">${new Date(rm[2]).toLocaleString()}</div>` : ''}
                  </div>
                `)
              }
            } else {
              if (history.length > 1 && el.historySort.type == 1) {
                history.reverse()
              }
              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" bvid="${rm[0]}">
                  </div>
                `)
              }
            }
            el.removedNum.textContent = result.length

            setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
            if (result.length > 0) {
              el.content.innerHTML = result.join('')
              const boxes = el.content.querySelectorAll('input[bvid]')
              for (const box of boxes) {
                box.addEventListener('click', async function() {
                  const status = this.checked
                  const bvid = this.getAttribute('bvid')
                  const note = status ? '添加到稍后再看' : '从稍后再看移除'
                  const success = await webpage?.method.switchVideoWatchlaterStatus(bvid, status)
                  if (success) {
                    api.message.create(`${note}成功`)
                  } else {
                    this.checked = !status
                    api.message.create(`${note}失败${status ? '，可能视频不可用，或为不支持的稿件类型（如互动视频）' : ''}`)
                  }
                })
              }
            } else {
              setEmptyContent('没有找到移除记录，请尝试增大历史回溯深度')
            }
          } catch (e) {
            setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
            setEmptyContent(`网络连接错误，出现这个问题有可能是因为网络加载速度不足或者B站后台 API 被改动。也不排除是脚本内部数据出错造成的，初始化脚本或清空稍后再看历史数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`)
            api.logger.error(e)
          } finally {
            el.content.style.opacity = '1'
          }
        }

        const setContentTop = () => {
          if (el.content) {
            el.content.style.top = `${el.comment.offsetTop + el.comment.offsetHeight}px`
          }
        }

        const setEmptyContent = text => {
          el.content.textContent = text
          el.content.style.color = 'gray'
          el.content.style.fontSize = '1.5em'
          el.content.style.paddingTop = '2em'
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = api.message.confirm('是否要初始化脚本？\n\n注意：本操作不会清理内部保存的稍后再看历史数据，要清理稍后再看历史数据请在用户设置中操作。')
      if (result) {
        const keyNoReset = { removeHistoryData: true, removeHistorySaves: true }
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          if (!keyNoReset[gmKey]) {
            GM_deleteValue(gmKey)
          }
        }
        gm.configVersion = 0
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
      }
    }

    /**
     * 清空 removeHistoryData
     */
    cleanRemoveHistoryData() {
      const result = api.message.confirm('是否要清空稍后再看历史数据？')
      if (result) {
        this.closeMenuItem('setting')
        GM_deleteValue('removeHistoryData')
        GM_deleteValue('removeHistoryFuzzyCompareReference')
        if (gm.config.reloadAfterSetting) {
          location.reload()
        } else {
          if (gm.config.removeHistory) {
            gm.data.removeHistoryData(true)
          }
        }
      }
    }

    /**
     * 对「打开菜单项」这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     * @param {string} name 菜单项的名称
     * @param {() => (void | Promise<void>)} [callback] 打开菜单项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他菜单项
     * @returns {Promise<boolean>} 操作是否成功
     */
    async openMenuItem(name, callback, keepOthers) {
      const _self = this
      let success = false
      const menu = gm.menu[name]
      if (menu.wait > 0) return false
      try {
        try {
          if (menu.state == 1) {
            menu.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 2,
              timeout: 1500 + (menu.el.fadeInTime ?? gm.const.fadeTime),
            })
            return true
          } else if (menu.state == 3) {
            menu.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 0,
              timeout: 1500 + (menu.el.fadeOutTime ?? gm.const.fadeTime),
            })
          }
        } catch (e) {
          menu.state = -1
          api.logger.error(e)
        } finally {
          menu.wait = 0
        }
        if (menu.state == 0 || menu.state == -1) {
          for (const key in gm.menu) {
            /** @type {GMObject_menu_item} */
            const menu = gm.menu[key]
            if (key == name) {
              menu.state = 1
              await menu.openHandler?.call(menu)
              await new Promise(resolve => {
                api.dom.fade(true, menu.el, () => {
                  resolve()
                  menu.openedHandler?.call(menu)
                  callback?.call(menu)
                })
              })
              menu.state = 2
              success = true
              // 不要返回，需将其他菜单项关闭
            } else if (!keepOthers) {
              if (menu.state == 2) {
                _self.closeMenuItem(key)
              }
            }
          }
        }
        if (success && document.fullscreenElement) {
          document.exitFullscreen()
        }
      } catch (e) {
        gm.menu[name].state = -1
        api.logger.error(e)
      }
      return success
    }

    /**
     * 对「关闭菜单项」这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @param {string} name 菜单项的名称
     * @param {() => (void | Promise<void>)} [callback] 关闭菜单项后的回调函数
     * @returns {Promise<boolean>} 操作是否成功
     */
    async closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      if (menu.wait > 0) return
      try {
        try {
          if (menu.state == 1) {
            menu.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 2,
              timeout: 1500 + (menu.el.fadeInTime ?? gm.const.fadeTime),
            })
          } else if (menu.state == 3) {
            menu.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 0,
              timeout: 1500 + (menu.el.fadeOutTime ?? gm.const.fadeTime),
            })
            return true
          }
        } catch (e) {
          menu.state = -1
          api.logger.error(e)
        } finally {
          menu.wait = 0
        }
        if (menu.state == 2 || menu.state == -1) {
          menu.state = 3
          await menu.closeHandler?.call(menu)
          await new Promise(resolve => {
            api.dom.fade(false, menu.el, () => {
              resolve()
              menu.closedHandler?.call(menu)
              callback?.call(menu)
            })
          })
          menu.state = 0
          return true
        }
      } catch (e) {
        menu.state = -1
        api.logger.error(e)
      }
      return false
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    constructor() {
      /** 通用方法 */
      this.method = {
        /** 内部数据 */
        _: {},

        /**
         * 获取指定 Cookie
         * @param {string} key 键
         * @returns {string} 值
         * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie#示例2_得到名为test2的cookie Document.cookie - Web API 接口参考 | MDN}
         */
        cookie(key) {
          return document.cookie.replace(RegExp(String.raw`(?:(?:^|.*;\s*)${key}\s*=\s*([^;]*).*$)|^.*$`), '$1')
        },

        /**
         * 判断用户是否已登录
         * @returns {boolean} 用户是否已登录
         */
        isLogin() {
          return Boolean(this.getCSRF())
        },

        /**
         * 获取 CSRF
         * @returns {string} `csrf`
         */
        getCSRF() {
          return this.cookie('bili_jct')
        },

        /**
         * 获取视频信息
         * @param {string} id `aid` 或 `bvid`
         * @param {'aid' | 'bvid'} [type='bvid'] `id` 类型
         * @returns {Promise<JSON>} 视频信息
         */
        async getVideoInfo(id, type = 'bvid') {
          const resp = await api.web.request({
            method: 'GET',
            url: gm.url.api_videoInfo(id, type),
          })
          return JSON.parse(resp.responseText).data
        },

        /**
         * 获取 `aid`
         * @returns {Promise<string>} `aid`
         */
        async getAid() {
          const aid = unsafeWindow.aid || await api.wait.waitForConditionPassed({
            condition: () => unsafeWindow.player?.getVideoMessage?.()?.aid,
          })
          return String(aid ?? '')
        },

        /**
         * 从 URL 获取视频 ID
         * @param {string} [url=location.pathname] 提取视频 ID 的源字符串
         * @returns {{id: string, type: 'aid' | 'bvid'}} `{id, type}`
         */
        getVid(url = location.pathname) {
          let m = null
          if ((m = /\/bv([0-9a-z]+)([/?#]|$)/i.exec(url))) {
            return { id: 'BV' + m[1], type: 'bvid' }
          } else if ((m = /\/(av)?(\d+)([/?#]|$)/i.exec(url))) { // 兼容 URL 中 BV 号被第三方修改为 AV 号的情况
            return { id: m[2], type: 'aid' }
          }
        },

        /**
         * 根据 `aid` 获取视频的稍后再看状态
         * @param {string} aid 视频 `aid`
         * @param {boolean} [reload] 是否重新加载
         * @param {boolean} [localCache=true] 是否使用本地缓存
         * @param {boolean} [disablePageCache] 是否禁用页面缓存
         * @returns {Promise<boolean>} 视频是否在稍后再看中
         */
        async getVideoWatchlaterStatusByAid(aid, reload = false, localCache = true, disablePageCache = false) {
          const current = await gm.data.watchlaterListData(reload, localCache, disablePageCache)
          if (current.length > 0) {
            for (const e of current) {
              if (aid == e.aid) {
                return true
              }
            }
          }
          return false
        },

        /**
         * 将视频加入稍后再看，或从稍后再看移除
         * @param {string} id 视频 `aid` 或 `bvid`（执行移除时优先选择 `aid`）
         * @param {boolean} [status=true] 添加 `true` / 移除 `false`
         * @returns {Promise<boolean>} 操作是否成功（视频不在稍后在看中不被判定为失败）
         */
        async switchVideoWatchlaterStatus(id, status = true) {
          const _self = this
          try {
            let typeA = !isNaN(id)
            if (!typeA && !status) { // 移除 API 只支持 aid，先作转换
              // 知乎上的算法似乎在某些情况下并不正确，保险起见发请求查询好了
              const info = await _self.getVideoInfo(id, 'bvid')
              id = String(info.aid)
              typeA = true
            }
            const data = new FormData()
            if (typeA) {
              data.append('aid', id)
            } else {
              data.append('bvid', id)
            }
            data.append('csrf', _self.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: status ? gm.url.api_addToWatchlater : gm.url.api_removeFromWatchlater,
              data: data,
            })
            return JSON.parse(resp.response).code == 0
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 清空稍后再看
         * @returns {Promise<boolean>} 操作是否成功
         */
        async clearWatchlater() {
          try {
            const data = new FormData()
            data.append('csrf', this.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: gm.url.api_clearWatchlater,
              data: data,
            })
            const success = JSON.parse(resp.response).code == 0
            if (success) {
              const empty = []
              gm.data._.watchlaterListData = empty
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', new Date().getTime())
                GM_setValue('watchlaterListCache', empty)
              }
            }
            return success
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 移除稍后再看已观看视频
         * @returns {Promise<boolean>} 操作是否成功
         */
        async clearWatchedInWatchlater() {
          try {
            const data = new FormData()
            data.append('viewed', true)
            data.append('csrf', this.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: gm.url.api_removeFromWatchlater,
              data: data,
            })
            const success = JSON.parse(resp.response).code == 0
            if (success) {
              gm.data._.watchlaterListData = null
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', 0)
              }
            }
            return success
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 使用稍后再看列表数据更新稍后再看历史数据
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         */
        updateRemoveHistoryData(reload) {
          const _ = this._
          if (gm.config.removeHistory) {
            if (!_.watchLaterListData_saved || reload) {
              if (!_.watchlaterListData_saving) {
                _.watchlaterListData_saving = true
                return gm.data.watchlaterListData(reload).then(current => {
                  if (current.length > 0) {
                    if (gm.config.removeHistoryFuzzyCompare > 0) {
                      const ref = GM_getValue('removeHistoryFuzzyCompareReference')
                      let same = true
                      if (ref) {
                        for (let i = 0; i < gm.config.removeHistoryFuzzyCompare; i++) {
                          const c = current[i]
                          const r = ref[i]
                          if (c) { // 如果 current 没有数据直接跳过得了
                            if (r) {
                              if (c.bvid != r) {
                                same = false
                                break
                              }
                            } else {
                              same = false
                              break
                            }
                          }
                        }
                      } else {
                        same = false
                      }
                      if (same) {
                        _.watchLaterListData_saved = true
                        return
                      } else {
                        if (current.length >= gm.config.removeHistoryFuzzyCompare) {
                          const newRef = []
                          for (let i = 0; i < gm.config.removeHistoryFuzzyCompare; i++) {
                            newRef.push(current[i].bvid)
                          }
                          GM_setValue('removeHistoryFuzzyCompareReference', newRef)
                        } else {
                          // 若 current 长度不够，那么加进去也白搭
                          GM_deleteValue('removeHistoryFuzzyCompareReference')
                        }
                      }
                    }

                    const data = gm.data.removeHistoryData()
                    let updated = false
                    if (gm.config.removeHistoryTimestamp) {
                      const timestamp = new Date().getTime()
                      const map = new Map()
                      for (let i = 0; i < data.size; i++) {
                        map.set(data.get(i)[0], i)
                      }
                      for (let i = current.length - 1; i >= 0; i--) {
                        const item = current[i]
                        if (map.has(item.bvid)) {
                          const idx = map.get(item.bvid)
                          data.get(idx)[2] = timestamp
                        } else {
                          data.push([item.bvid, item.title, timestamp])
                        }
                      }
                      updated = true
                    } else {
                      const set = new Set()
                      for (let i = 0; i < data.size; i++) {
                        set.add(data.get(i)[0])
                      }
                      for (let i = current.length - 1; i >= 0; i--) {
                        const item = current[i]
                        if (!set.has(item.bvid)) {
                          data.push([item.bvid, item.title])
                          updated = true
                        }
                      }
                    }
                    if (updated) {
                      GM_setValue('removeHistoryData', data)
                    }
                    _.watchLaterListData_saved = true
                  }
                }).finally(() => {
                  _.watchlaterListData_saving = false
                })
              }
            }
          }
        },

        /**
         * 获取稍后再看列表数据以指定值为键的映射
         * @param {(GMObject_data_item0) => *} key 计算键值的方法
         * @param {string} [cacheId] 缓存 ID，保留空值时不缓存
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         * @param {boolean} [cache=true] 是否使用稍后再看列表数据本地缓存
         * @param {boolean} [disablePageCache] 是否禁用稍后再看列表数据页面缓存
         * @returns {Map<string, GMObject_data_item0>} 稍后再看列表数据以指定值为键的映射
         */
        async getWatchlaterDataMap(key, cacheId, reload, cache = true, disablePageCache = false) {
          let obj = null
          if (cacheId) {
            const _ = this._
            if (!_.watchlaterDataSet) {
              _.watchlaterDataSet = {}
            }
            obj = _.watchlaterDataSet
          }
          if (!obj?.[cacheId] || reload || disablePageCache) {
            const map = new Map()
            const current = await gm.data.watchlaterListData(reload, cache, disablePageCache)
            for (const item of current) {
              map.set(key(item), item)
            }
            if (cacheId) {
              obj[cacheId] = map
            } else {
              obj = map
            }
          }
          return cacheId ? obj[cacheId] : obj
        },

        /**
         * 清理 URL 上的查询参数
         */
        cleanSearchParams() {
          if (location.search.indexOf(gm.id) < 0) return
          let removed = false
          const url = new URL(location.href)
          const searchParams = url.searchParams
          gm.searchParams.forEach((value, key) => {
            if (key.startsWith(gm.id)) {
              searchParams.delete(key)
              removed = true
            }
          })
          if (removed && location.href != url.href) {
            history.replaceState({}, null, url.href)
          }
        },

        /**
         * 将秒格式的时间转换为字符串形式
         * @param {number} sTime 秒格式的时间
         * @returns {string} 字符串形式
         */
        getSTimeString(sTime) {
          let iH = 0
          let iM = Math.floor(sTime / 60)
          if (iM >= 60) {
            iH = Math.floor(iM / 60)
            iM = iM % 60
          }
          const iS = sTime % 60

          let sH = ''
          if (iH > 0) {
            sH = String(iH)
            if (sH.length < 2) {
              sH = '0' + sH
            }
          }
          let sM = String(iM)
          if (sM.length < 2) {
            sM = '0' + sM
          }
          let sS = String(iS)
          if (sS.length < 2) {
            sS = '0' + sS
          }
          return `${sH ? sH + ':' : ''}${sM}:${sS}`
        }
      }
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    addHeaderButton() {
      const _self = this
      if (gm.config.headerCompatible == Enums.headerCompatible.bilibiliEvolved) {
        api.wait.waitQuerySelector('.custom-navbar [data-name=watchlaterList]').then(el => {
          const watchlater = el.parentElement.appendChild(el.cloneNode(true))
          el.style.display = 'none'
          const link = watchlater.querySelector('a.main-content')
          link.href = gm.url.noop
          link.target = '_self'
          processClickEvent(watchlater)
          processPopup(watchlater)
          const ob = new MutationObserver((mutations, observer) => {
            for (const mutation of mutations) {
              if (mutation.attributeName) {
                watchlater.setAttribute(mutation.attributeName, el.getAttribute(mutation.attributeName))
              }
            }
            observer.disconnect()
            watchlater.style.display = ''
            el.style.display = 'none'
            observer.observe(el, { attributes: true })
          })
          ob.observe(el, { attributes: true })
        })
        api.dom.addStyle(`
          #${gm.id} .gm-entrypopup[gm-compatible] .gm-popup-arrow {
            display: none;
          }
          #${gm.id} .gm-entrypopup[gm-compatible] .gm-entrypopup-page {
            box-shadow: rgb(0 0 0 / 20%) 0 4px 8px 0;
            border-radius: 8px;
            margin-top: -12px;
          }
        `)
      } else {
        api.wait.waitQuerySelector('.user-con.signin').then(header => {
          const collect = header.children[4]
          const watchlater = document.createElement('div')
          watchlater.className = 'item'
          watchlater.innerHTML = '<a><span class="name">稍后再看</span></a>'
          header.insertBefore(watchlater, collect)
          processClickEvent(watchlater)
          processPopup(watchlater)
        })
      }

      /**
       * 处理清空稍后再看
       * @returns {Promise<boolean>} 是否清空成功
       */
      async function clearWatchlater() {
        let success = false
        const result = api.message.confirm('是否清空稍后再看？')
        if (result) {
          success = await _self.method.clearWatchlater()
          api.message.create(`清空稍后再看${success ? '成功' : '失败'}`)
          if (success && api.web.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          }
        }
        return success
      }

      /**
       * 移除稍后再看已观看视频
       * @returns {Promise<boolean>} 是否移除成功
       */
      async function clearWatchedInWatchlater() {
        let success = false
        const result = api.message.confirm('是否移除已观看视频？')
        if (result) {
          success = await _self.method.clearWatchedInWatchlater()
          api.message.create(`移除已观看视频${success ? '成功' : '失败'}`)
          if (success && api.web.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          }
        }
        return success
      }

      /**
       * 处理鼠标点击事件
       * @param {HTMLElement} watchlater 稍后再看入口元素
       */
      function processClickEvent(watchlater) {
        const config = [gm.config.headerButtonOpL, gm.config.headerButtonOpM, gm.config.headerButtonOpR]
        /**
         * 处理鼠标点击事件
         * @param {1 | 2 | 3} button 左键 | 中键 | 右键
         */
        const process = button => {
          const cfg = config[button]
          switch (cfg) {
            case Enums.headerButtonOp.openListInCurrent:
            case Enums.headerButtonOp.openListInNew:
            case Enums.headerButtonOp.playAllInCurrent:
            case Enums.headerButtonOp.playAllInNew: {
              const action = getHeaderButtonOpConfig(cfg)
              window.open(action.href, action.target)
              break
            }
            case Enums.headerButtonOp.clearWatchlater:
              clearWatchlater()
              break
            case Enums.headerButtonOp.clearWatchedInWatchlater:
              clearWatchedInWatchlater()
              break
            case Enums.headerButtonOp.openUserSetting:
              script.openUserSetting()
              break
            case Enums.headerButtonOp.openRemoveHistory:
              script.openRemoveHistory()
              break
          }
        }
        watchlater.onmousedown = function(e) {
          if (e.button != 2) {
            process(e.button)
            e.preventDefault()
          }
        }
        watchlater.oncontextmenu = function(e) {
          process(2) // 整合写进 mousedown 中会导致无法阻止右键菜单弹出
          e.preventDefault()
        }
      }

      /**
       * 处理弹出菜单
       * @param {HTMLElement} watchlater 稍后再看元素
       */
      function processPopup(watchlater) {
        if (gm.config.headerMenu == Enums.headerMenu.disable) return
        gm.menu.entryPopup.el = document.createElement('div')
        const popup = gm.menu.entryPopup.el
        // 模仿官方顶栏弹出菜单的弹出与关闭效果
        popup.fadeInFunction = 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
        popup.fadeOutFunction = 'cubic-bezier(0.6, -0.3, 0.65, 1)'
        popup.fadeOutNoInteractive = true
        // 此处必须用 over；若用 enter，且网页刚加载完成时鼠标正好在入口上，无法轻移鼠标以触发事件
        watchlater.addEventListener('mouseover', onOverWatchlater)
        watchlater.addEventListener('mouseleave', onLeaveWatchlater)
        popup.addEventListener('mouseenter', onEnterPopup)
        popup.addEventListener('mouseleave', onLeavePopup)

        /**
         * 鼠标是否在顶栏内
         * @param {MouseEvent} e 事件
         */
        function withinHeader(e) {
          const y = e.clientY
          const rect = watchlater.getBoundingClientRect()
          const trim = 2 // e.clientY 在旧标准中为长整型，向内修正以确保正确性（此处理论取 1 即可）
          return y >= rect.top + trim && y <= rect.bottom - trim
        }

        /**
         * 进入稍后再看入口的处理
         */
        function onOverWatchlater() {
          if (this.mouseOver) return
          this.mouseOver = true
          // 预加载数据，延时以在避免误触与加载速度间作平衡
          if (gm.config.watchlaterListCacheValidPeriod > 0) {
            setTimeout(() => {
              if (this.mouseOver) {
                if (gm.menu.entryPopup.needReload) {
                  gm.menu.entryPopup.needReload = false
                  gm.data.watchlaterListData(true)
                } else {
                  gm.data.watchlaterListData(false, true, true) // 启用本地缓存但禁用页面缓存
                }
              }
            }, 25) // 以鼠标快速掠过不触发为准
          }
          // 完整加载，延时以避免误触
          // 误触率与弹出速度正相关，与数据加载时间无关
          setTimeout(() => {
            if (this.mouseOver) {
              popup.style.position = api.dom.isFixed(watchlater.offsetParent) ? 'fixed' : ''
              const rect = watchlater.getBoundingClientRect()
              popup.style.top = `${rect.bottom}px`
              popup.style.left = `calc(${(rect.left + rect.right) / 2}px - 16em)`
              openEntryPopup()
            }
          }, 125) // 以鼠标中速掠过不触发为准
        }

        /**
         * 离开稍后再看入口的处理
         * @param {MouseEvent} e 事件
         */
        function onLeaveWatchlater(e) {
          this.mouseOver = false
          if (withinHeader(e)) {
            script.closeMenuItem('entryPopup')
          } else {
            setTimeout(() => {
              if (!this.mouseOver && !popup.mouseOver) {
                script.closeMenuItem('entryPopup')
              }
            }, 150)
          }
        }

        /**
         * 进入弹出菜单的处理
         */
        function onEnterPopup() {
          this.mouseOver = true
        }

        /**
         * 离开弹出菜单的处理
         */
        function onLeavePopup() {
          this.mouseOver = false
          setTimeout(() => {
            if (!this.mouseOver && !watchlater.mouseOver) {
              script.closeMenuItem('entryPopup')
            }
          }, 50)
        }
      }

      /**
       * 打开入口弹出菜单
       */
      function openEntryPopup() {
        if (gm.el.entryPopup) {
          script.openMenuItem('entryPopup')
        } else {
          const el = {}
          setTimeout(() => {
            initPopup()
            processPopup()
            script.openMenuItem('entryPopup')
          })

          /**
           * 初始化
           */
          const initPopup = () => {
            const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
            const target = openLinkInCurrent ? '_self' : '_blank'
            gm.el.entryPopup = gm.el.gmRoot.appendChild(gm.menu.entryPopup.el)
            if (gm.config.headerCompatible != Enums.headerCompatible.none) {
              gm.el.entryPopup.setAttribute('gm-compatible', gm.config.headerCompatible)
            }
            gm.el.entryPopup.className = 'gm-entrypopup'
            gm.el.entryPopup.innerHTML = `
              <div class="gm-popup-arrow"></div>
              <div class="gm-entrypopup-page">
                <div class="gm-popup-header">
                  <div class="gm-search">
                    <input type="text" placeholder="在列表中搜索... 支持通配符 ( ? * )">
                    <div class="gm-search-clear">✖</div>
                  </div>
                  <div class="gm-popup-total" title="列表条目数">0</div>
                </div>
                <div class="gm-entry-list-empty">稍后再看列表为空</div>
                <div class="gm-entry-list"></div>
                <div class="gm-entry-list gm-entry-removed-list"></div>
                <div class="gm-entry-bottom">
                  <a class="gm-entry-button" fn="setting" href="${gm.url.noop}" target="_self">设置</a>
                  <a class="gm-entry-button" fn="history" href="${gm.url.noop}" target="_self">历史</a>
                  <a class="gm-entry-button" fn="removeAll" href="${gm.url.noop}" target="_self">清空</a>
                  <a class="gm-entry-button" fn="removeWatched" href="${gm.url.noop}" target="_self">移除已看</a>
                  <a class="gm-entry-button" fn="showAll" href="${gm.url.page_watchlaterList}" target="${target}">显示</a>
                  <a class="gm-entry-button" fn="playAll" href="${gm.url.page_watchlaterPlayAll}" target="${target}">播放</a>
                  <a class="gm-entry-button" fn="sortControl" href="${gm.url.noop}" target="_self">
                    <div class="gm-select">
                      <div class="gm-selected" value="">排序</div>
                      <div class="gm-options">
                        <div class="gm-option" value="${Enums.sortType.title}">标题</div>
                        ${gm.config.headerMenu == Enums.headerMenu.enable ? `
                          <div class="gm-option" value="${Enums.sortType.uploader}">UP 主</div>
                          <div class="gm-option" value="${Enums.sortType.progress}">进度</div>
                          <div class="gm-option" value="${Enums.sortType.durationR}">时长↓</div>
                          <div class="gm-option" value="${Enums.sortType.duration}">时长</div>
                        ` : ''}
                        <div class="gm-option" value="${Enums.sortType.defaultR}">默认↓</div>
                        <div class="gm-option gm-option-selected" value="${Enums.sortType.default}">默认</div>
                      </div>
                    </div>
                  </a>
                  <a class="gm-entry-button" fn="autoRemoveControl" href="${gm.url.noop}" target="_self">移除</a>
                </div>
              </div>
            `
            el.entryList = gm.el.entryPopup.querySelector('.gm-entry-list')
            el.entryRemovedList = gm.el.entryPopup.querySelector('.gm-entry-removed-list')
            el.entryListEmpty = gm.el.entryPopup.querySelector('.gm-entry-list-empty')
            el.entryHeader = gm.el.entryPopup.querySelector('.gm-popup-header')
            el.search = gm.el.entryPopup.querySelector('.gm-search input')
            el.searchClear = gm.el.entryPopup.querySelector('.gm-search-clear')
            el.popupTotal = gm.el.entryPopup.querySelector('.gm-popup-total')
            el.entryBottom = gm.el.entryPopup.querySelector('.gm-entry-bottom')
          }

          /**
           * 维护内部元素
           */
          const processPopup = () => {
            gm.menu.entryPopup.openHandler = onOpen
            gm.menu.entryPopup.openedHandler = () => {
              gm.config.headerMenuSearch && el.search.focus()
            }

            if (gm.config.headerMenuSearch) {
              el.search.addEventListener('input', function() {
                const m = /^\s+(.*)/.exec(this.value)
                if (m) {
                  this.value = m[1]
                  this.setSelectionRange(0, 0)
                }
                el.searchClear.style.visibility = this.value.length > 0 ? 'visible' : ''
              })
              el.search.addEventListener('input', api.tool.throttle(function() {
                let val = this.value.trim()
                const match = str => str && val?.test(str)
                const lists = gm.config.headerMenuKeepRemoved ? [el.entryList, el.entryRemovedList] : [el.entryList]
                if (val.length > 0) {
                  try {
                    val = val.replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex
                      .replaceAll('?', '.').replaceAll('*', '.+') // 通配符
                    val = new RegExp(val, 'i')
                  } catch (e) {
                    val = null
                  }
                } else {
                  val = null
                }
                const cnt = [0, 0]
                for (let i = 0; i < lists.length; i++) {
                  const list = lists[i]
                  if (list.total > 0) {
                    for (let j = 0; j < list.childElementCount; j++) {
                      let valid = false
                      const card = list.children[j]
                      if (val) {
                        if (match(card.vTitle)) {
                          valid = true
                        } else if (match(card.uploader)) {
                          valid = true
                        }
                      } else {
                        valid = true
                      }
                      if (valid) {
                        cnt[i] += 1
                        api.dom.removeClass(card, 'gm-search-hide')
                      } else {
                        api.dom.addClass(card, 'gm-search-hide')
                      }
                    }
                    list.scrollTop = 0
                  }
                }
                el.popupTotal.textContent = `${cnt[0]}${cnt[1] > 0 ? `/${cnt[0] + cnt[1]}` : ''}`
                if (cnt[0]) {
                  el.entryListEmpty.style.display = 'none'
                } else {
                  el.entryListEmpty.style.display = 'unset'
                }
              }, gm.const.inputThrottleWait))
              el.searchClear.onclick = function() {
                el.search.value = ''
                el.search.dispatchEvent(new Event('input'))
              }
            } else {
              el.entryHeader.style.display = 'none'
            }

            el.entryFn = {}
            const buttons = el.entryBottom.querySelectorAll('.gm-entry-button')
            for (const button of buttons) {
              const fn = button.getAttribute('fn')
              if (fn) {
                el.entryFn[fn] = button
              }
            }

            // 排序控制器
            {
              el.entryFn.sortControl.control = el.entryFn.sortControl.firstElementChild
              const control = el.entryFn.sortControl.control
              const selected = control.selected = control.children[0]
              const options = control.options = control.children[1]

              let defaultSelect = options.querySelector('.gm-option-selected') ?? options.firstElementChild
              if (gm.config.autoSort != Enums.autoSort.default) {
                let type = gm.config.autoSort
                if (type == Enums.autoSort.auto) {
                  type = GM_getValue('autoSort_auto')
                  if (!type) {
                    type = Enums.sortType.default
                    GM_setValue('autoSort_auto', type)
                  }
                }
                selected.option = options.querySelector(`[value="${type}"]`)
                if (selected.option) {
                  defaultSelect && api.dom.removeClass(defaultSelect, 'gm-option-selected')
                  api.dom.addClass(selected.option, 'gm-option-selected')
                  selected.setAttribute('value', selected.option.getAttribute('value'))
                } else if (gm.config.autoSort == Enums.autoSort.auto) {
                  type = Enums.sortType.default
                  GM_setValue('autoSort_auto', type)
                }
              }
              if (!selected.option) {
                selected.option = defaultSelect
                if (selected.option) {
                  api.dom.addClass(selected.option, 'gm-option-selected')
                  selected.setAttribute('value', selected.option.getAttribute('value'))
                }
              }

              if (gm.config.headerMenuSortControl) {
                el.entryFn.sortControl.setAttribute('enabled', '')
                options.fadeOutNoInteractive = true

                el.entryFn.sortControl.addEventListener('click', function() {
                  if (!control.selecting) {
                    control.selecting = true
                    api.dom.fade(true, options)
                  }
                })
                el.entryFn.sortControl.addEventListener('mouseenter', function() {
                  control.selecting = true
                  api.dom.fade(true, options)
                })
                el.entryFn.sortControl.addEventListener('mouseleave', function() {
                  control.selecting = false
                  api.dom.fade(false, options)
                })
                options.addEventListener('click', function(e) {
                  control.selecting = false
                  api.dom.fade(false, this)
                  const val = e.target.getAttribute('value')
                  if (selected.getAttribute('value') != val) {
                    api.dom.removeClass(selected.option, 'gm-option-selected')
                    selected.setAttribute('value', val)
                    selected.option = e.target
                    api.dom.addClass(selected.option, 'gm-option-selected')
                    if (gm.config.autoSort == Enums.autoSort.auto) {
                      GM_setValue('autoSort_auto', val)
                    }
                    sort(val)
                  }
                })
              }
            }

            // 自动移除控制器
            const cfgAutoRemove = gm.config.autoRemove
            const autoRemove = cfgAutoRemove == Enums.autoRemove.always || cfgAutoRemove == Enums.autoRemove.openFromList
            el.entryFn.autoRemoveControl.autoRemove = autoRemove
            if (gm.config.headerMenuAutoRemoveControl) {
              if (cfgAutoRemove == Enums.autoRemove.absoluteNever) {
                el.entryFn.autoRemoveControl.setAttribute('disabled', '')
                el.entryFn.autoRemoveControl.addEventListener('click', function() {
                  api.message.create('当前彻底自动移除功能，无法执行操作')
                })
              } else {
                if (autoRemove) {
                  api.dom.addClass(el.entryFn.autoRemoveControl, 'gm-popup-auto-remove')
                }
                el.entryFn.autoRemoveControl.addEventListener('click', function() {
                  if (this.autoRemove) {
                    api.dom.removeClass(this, 'gm-popup-auto-remove')
                    api.message.create('已临时关闭自动移除功能')
                  } else {
                    api.dom.addClass(this, 'gm-popup-auto-remove')
                    api.message.create('已临时开启自动移除功能')
                  }
                  this.autoRemove = !this.autoRemove
                })
              }
              el.entryFn.autoRemoveControl.setAttribute('enabled', '')
            }
            // 常规项
            if (gm.config.headerMenuFnSetting) {
              el.entryFn.setting.setAttribute('enabled', '')
              el.entryFn.setting.addEventListener('click', () => script.openUserSetting())
            }
            if (gm.config.headerMenuFnHistory) {
              el.entryFn.history.setAttribute('enabled', '')
              el.entryFn.history.addEventListener('click', () => script.openRemoveHistory())
            }
            if (gm.config.headerMenuFnRemoveAll) {
              el.entryFn.removeAll.setAttribute('enabled', '')
              el.entryFn.removeAll.addEventListener('click', function() {
                script.closeMenuItem('entryPopup')
                clearWatchlater()
              })
            }
            if (gm.config.headerMenuFnRemoveWatched) {
              el.entryFn.removeWatched.setAttribute('enabled', '')
              el.entryFn.removeWatched.addEventListener('click', function() {
                script.closeMenuItem('entryPopup')
                clearWatchedInWatchlater()
              })
            }
            if (gm.config.headerMenuFnShowAll) {
              el.entryFn.showAll.setAttribute('enabled', '')
            }
            if (gm.config.headerMenuFnPlayAll) {
              el.entryFn.playAll.setAttribute('enabled', '')
            }
            if (el.entryBottom.querySelectorAll('[enabled]').length < 1) {
              el.entryBottom.style.display = 'none'
            }
          }

          /**
           * 打开时弹出菜单时执行
           */
          const onOpen = async () => {
            // 上半区被移除卡片先于下半区被查询到，恰巧使得后移除视频最后生成在被移除列表前方，无须额外排序
            const rmCards = gm.config.headerMenuKeepRemoved ? gm.el.entryPopup.querySelectorAll('.gm-removed') : null
            let rmBvid = null
            if (rmCards?.length > 0) {
              rmBvid = new Set()
              for (const rmCard of rmCards) {
                rmBvid.add(rmCard.bvid)
              }
            }
            gm.menu.entryPopup.sortType = Enums.sortType.default
            el.popupTotal.textContent = '0'
            el.entryList.innerHTML = ''
            el.entryList.total = 0
            el.entryRemovedList.innerHTML = ''
            el.entryRemovedList.total = 0
            let data = []
            if (gm.menu.entryPopup.needReload) {
              gm.menu.entryPopup.needReload = false
              data = await gm.data.watchlaterListData(true)
            } else {
              data = await gm.data.watchlaterListData(false, true, true) // 启用本地缓存但禁用页面缓存
            }
            const simplePopup = gm.config.headerMenu == Enums.headerMenu.enableSimple
            let serial = 0
            if (data.length > 0) {
              const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
              const redirect = gm.config.redirect
              const autoRemoveControl = el.entryFn.autoRemoveControl
              for (const item of data) {
                /** @type {HTMLAnchorElement} */
                const card = el.entryList.appendChild(document.createElement('a'))
                card.serial = serial++
                const valid = item.state >= 0
                card.vTitle = item.title
                card.bvid = item.bvid
                if (rmBvid?.size > 0) {
                  if (rmBvid.has(card.bvid)) {
                    rmBvid.delete(card.bvid)
                  }
                }
                if (simplePopup) {
                  if (valid) {
                    card.textContent = card.vTitle
                  } else {
                    card.innerHTML = `<b>[已失效]</b> ${card.vTitle}`
                  }
                  card.className = 'gm-entry-list-simple-item'
                } else {
                  card.uploader = item.owner.name
                  card.duration = item.duration
                  const multiP = item.videos > 1
                  const duration = _self.method.getSTimeString(item.duration)
                  const durationP = multiP ? `${item.videos}P` : duration
                  const played = item.progress > 0
                  card.progress = (multiP && played) ? card.duration : item.progress
                  let progress = ''
                  if (played) {
                    if (multiP) {
                      progress = '已观看'
                    } else {
                      progress = _self.method.getSTimeString(item.progress)
                    }
                  }
                  card.className = `gm-entry-list-item${multiP ? ' gm-card-multiP' : ''}`
                  card.innerHTML = `
                    <div class="gm-card-left">
                      <img class="gm-card-cover" src="${item.pic}@156w_88h_1c_100q.webp">
                      <div class="gm-card-switcher"></div>
                      <div class="gm-card-duration">
                        <div>${duration}</div>
                        ${multiP ? `<div>${durationP}</div>` : ''}
                      </div>
                    </div>
                    <div class="gm-card-right">
                      <div class="gm-card-title">${valid ? card.vTitle : `<b>[已失效]</b> ${card.vTitle}`}</div>
                      <a class="gm-card-uploader" target="_blank" href="${gm.url.page_userSpace(item.owner.mid)}">${card.uploader}</a>
                      <div class="gm-card-progress">${progress}</div>
                    </div>
                  `
                  if (played) {
                    card.querySelector('.gm-card-progress').style.display = 'unset'
                    card.querySelector('.gm-card-uploader').style.maxWidth = '15em'
                  }

                  card.added = true
                  const switcher = card.querySelector('.gm-card-switcher')
                  switcher.addEventListener('click', function(e) {
                    gm.menu.entryPopup.needReload = true
                    e.preventDefault() // 不能放到 async 中
                    setTimeout(async () => {
                      const added = card.added
                      // 先改了 UI 再说，不要给用户等待感
                      if (added) {
                        api.dom.addClass(card, 'gm-removed')
                      } else {
                        api.dom.removeClass(card, 'gm-removed')
                      }
                      const note = added ? '从稍后再看移除' : '添加到稍后再看'
                      const success = await _self.method.switchVideoWatchlaterStatus(item.aid, !added)
                      if (success) {
                        card.added = !added
                        api.message.create(`${note}成功`)
                      } else {
                        if (added) {
                          api.dom.removeClass(card, 'gm-removed')
                        } else {
                          api.dom.addClass(card, 'gm-removed')
                        }
                        api.message.create(`${note}失败`)
                      }
                    }, 10)
                  })
                }
                if (valid) {
                  card.target = openLinkInCurrent ? '_self' : '_blank'
                  if (redirect) {
                    card.href = `${gm.url.page_videoNormalMode}/${item.bvid}`
                  } else {
                    card.href = `${gm.url.page_videoWatchlaterMode}/${item.bvid}`
                  }
                  if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
                    card._originalHref = card.href
                    card.addEventListener('mousedown', function(e) {
                      if (e.button == 0 || e.button == 1) { // 左键或中键
                        if (!simplePopup && api.dom.containsClass(e.target, ['gm-card-switcher', 'gm-card-uploader'])) return
                        if (autoRemoveControl.autoRemove) {
                          if (gm.config.autoRemove != Enums.autoRemove.always) {
                            const url = new URL(this.href)
                            url.searchParams.set(`${gm.id}_remove`, 'true')
                            this.href = url.href
                          } else {
                            this.href = this._originalHref
                          }
                        } else {
                          if (gm.config.autoRemove == Enums.autoRemove.always) {
                            const url = new URL(this.href)
                            url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                            this.href = url.href
                          } else {
                            this.href = this._originalHref
                          }
                        }
                      }
                    })
                    card.addEventListener('mouseup', function(e) {
                      if (e.button == 0 || e.button == 1) { // 左键或中键
                        if (!simplePopup) {
                          if (!card.added) return
                          if (api.dom.containsClass(e.target, ['gm-card-switcher', 'gm-card-uploader'])) return
                        }
                        if (autoRemoveControl.autoRemove) {
                          gm.menu.entryPopup.needReload = true
                          api.dom.addClass(card, 'gm-removed')
                          card.added = false
                        }
                      }
                    })
                  }
                } else {
                  api.dom.addClass(card, 'gm-invalid')
                  card.target = '_self'
                  card.href = gm.url.noop
                }
              }
              el.entryList.total = data.length
            } else {
              el.entryListEmpty.style.display = 'unset'
            }

            // 添加已移除视频
            if (rmCards?.length > 0) {
              const addedBvid = new Set()
              for (const rmCard of rmCards) {
                rmCard.serial = serial++
                const bvid = rmCard.bvid
                if (addedBvid.has(bvid)) continue
                if (rmBvid.has(bvid)) {
                  if (rmCard.style.display == 'none') {
                    rmCard.style.display = ''
                  }
                } else {
                  rmCard.style.display = 'none'
                }
                el.entryRemovedList.appendChild(rmCard)
                addedBvid.add(bvid)
              }
            }
            if (rmBvid?.size > 0) {
              const only1 = rmBvid.size == 1
              const h = simplePopup ? (only1 ? 6 : 9) : (only1 ? 6.4 : 11)
              el.entryList.style.height = `${42 - h}em`
              el.entryRemovedList.style.height = `${h}em`
              el.entryRemovedList.style.display = 'block'
              el.entryRemovedList.total = rmBvid.size
            } else {
              el.entryList.style.height = ''
              el.entryRemovedList.style.display = ''
            }

            el.popupTotal.textContent = `${el.entryList.total}${el.entryRemovedList.total > 0 ? `/${el.entryList.total + el.entryRemovedList.total}` : ''}`
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.listAndMenu) {
              _self.method.updateRemoveHistoryData()
            }

            gm.el.entryPopup.style.display = 'unset'
            el.entryList.scrollTop = 0
            el.entryRemovedList.scrollTop = 0

            const sortType = el.entryFn.sortControl.control.selected.getAttribute('value')
            sortType && sort(sortType)
            if (el.search.value.length > 0) {
              el.search.dispatchEvent(new Event('input'))
            }
          }

          /**
           * 对弹出菜单列表中的内容进行排序
           * @param {sortType} type 排序类型
           */
          const sort = type => {
            if (type == gm.menu.entryPopup.sortType) return
            gm.menu.entryPopup.sortType = type
            if (el.entryList.total < 2 && el.entryRemovedList.total < 2) return
            let reverse = type.endsWith(':R')
            const k = type.replace(/:R$/, '')

            const lists = []
            if (el.entryList.total > 1) {
              lists.push(el.entryList)
            }
            if (el.entryRemovedList.total > 1) {
              lists.push(el.entryRemovedList)
            }
            for (const list of lists) {
              const cards = Array.from(list.children)
              cards.sort((a, b) => {
                let result = 0
                const va = a[k]
                const vb = b[k]
                if (typeof va == 'string') {
                  result = va.localeCompare(vb)
                } else if (!isNaN(va)) {
                  result = va - vb
                }
                return reverse ? -result : result
              })
              for (const card of cards) {
                list.appendChild(card)
              }
              list.scrollTop = 0
            }
          }
        }
      }

      /**
       * 获取入口点击的链接设置
       * @param {headerButtonOp} op
       * @returns {{href: string, target: '_self' | '_blank'}}
       */
      function getHeaderButtonOpConfig(op) {
        /** @type {{href: string, target: '_self' | '_blank'}} */
        const result = {}
        switch (op) {
          case Enums.headerButtonOp.openListInCurrent:
          case Enums.headerButtonOp.openListInNew:
            result.href = gm.url.page_watchlaterList
            break
          case Enums.headerButtonOp.playAllInCurrent:
          case Enums.headerButtonOp.playAllInNew:
            result.href = gm.url.page_watchlaterPlayAll
            break
          case Enums.headerButtonOp.clearWatchlater:
          case Enums.headerButtonOp.openUserSetting:
          case Enums.headerButtonOp.openRemoveHistory:
          case Enums.headerButtonOp.noOperation:
            result.href = gm.url.noop
            break
        }
        switch (op) {
          case Enums.headerButtonOp.openListInNew:
          case Enums.headerButtonOp.playAllInNew:
            result.target = '_blank'
            break
          default:
            result.target = '_self'
        }
        if (result.href != gm.url.noop) {
          const url = new URL(result.href)
          url.searchParams.set(`${gm.id}_from_header`, 'true')
          result.href = url.href
        }
        return result
      }
    }

    /**
     * 填充稍后再看状态
     */
    async fillWatchlaterStatus() {
      const _self = this
      let map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid')
      if (api.web.urlMatch(gm.regex.page_dynamicMenu)) { // 必须在动态页之前匹配
        fillWatchlaterStatus_dynamicMenu()
      } else if (api.web.urlMatch(gm.regex.page_dynamic)) {
        if (location.pathname == '/') { // 仅动态主页
          api.wait.waitQuerySelector('.feed-card').then(feed => {
            api.wait.executeAfterElementLoaded({
              selector: '.tab',
              base: feed,
              multiple: true,
              callback: tab => {
                tab.addEventListener('click', async function() {
                  map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid', true)
                  // map 更新期间，ob 偷跑可能会将错误的数据写入，重新遍历并修正之
                  const videos = feed.querySelectorAll('.video-container')
                  for (const video of videos) {
                    const vue = video.__vue__
                    if (vue) {
                      const aid = String(vue.aid)
                      if (map.has(aid)) {
                        vue.seeLaterStatus = 1
                      } else {
                        vue.seeLaterStatus = 0
                      }
                    }
                  }
                })
              },
            })
            fillWatchlaterStatus_dynamic()
          })
        }
      } else if (api.web.urlMatch(gm.regex.page_userSpace)) {
        // 用户空间中也有动态，但用户未必切换到动态子窗口，故需长时间等待
        api.wait.waitForElementLoaded({
          selector: '.feed-card',
          timeout: 0,
        }).then(() => fillWatchlaterStatus_dynamic())
      } else {
        // 两部分 URL 刚好不会冲突，放到 else 中即可
        // 用户空间「投稿」理论上需要单独处理，但该处逻辑和数据都在一个闭包里，无法通过简单的方式实现，经考虑选择放弃
        switch (gm.config.fillWatchlaterStatus) {
          case Enums.fillWatchlaterStatus.dynamicAndVideo:
            if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
              fillWatchlaterStatus_main()
            }
            return
          case Enums.fillWatchlaterStatus.anypage:
            fillWatchlaterStatus_main()
            return
          case Enums.fillWatchlaterStatus.never:
          default:
            return
        }
      }

      /**
       * 填充动态页稍后再看状态
       */
      async function fillWatchlaterStatus_dynamic() {
        api.wait.executeAfterElementLoaded({
          selector: '.video-container',
          base: await api.wait.waitQuerySelector('.feed-card'),
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            // 这个 video 未必是最后加入到页面的视频卡片，有可能是作为 Vue 处理过程中的中转元素
            const vue = video.__vue__ // 此时理应有 Vue 对象，如果没有就说明它可能是中转元素
            // 但是，即使 video 真是中转元素，也有可能出现存在 __vue__ 的情况，实在没搞懂是什么原理
            // 总之，只要有 Vue 对象，一率进行处理就不会有问题！
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.seeLaterStatus = 1
              }
            }
          },
        })
      }

      /**
       * 填充动态入口菜单稍后再看状态
       */
      async function fillWatchlaterStatus_dynamicMenu() {
        api.wait.executeAfterElementLoaded({
          selector: '.list-item',
          base: await api.wait.waitQuerySelector('.video-list'),
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            const vue = video.__vue__
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.added = true
              }
            }
          },
        })
      }

      /**
       * 填充稍后再看状态（通用逻辑）
       */
      function fillWatchlaterStatus_main() {
        api.wait.executeAfterElementLoaded({
          selector: '.watch-later-video, .watch-later-trigger, .watch-later, .w-later',
          base: document.body,
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            const vue = video.__vue__
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.added = true
              }
            }
          },
        })
      }
    }

    /**
     * 在播放页加入快速切换稍后再看状态的按钮
     */
    async addVideoButton() {
      const _self = this
      let bus = {}

      const app = await api.wait.waitQuerySelector('#app')
      const atr = await api.wait.waitQuerySelector('#arc_toolbar_report', app)
      const original = await api.wait.waitQuerySelector('.van-watchlater', atr)
      api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      }).then(async () => {
        const btn = document.createElement('label')
        btn.id = `${gm.id}-video-btn`
        const cb = btn.appendChild(document.createElement('input'))
        cb.type = 'checkbox'
        const text = btn.appendChild(document.createElement('span'))
        text.textContent = '稍后再看'
        btn.className = 'appeal-text'
        cb.onclick = function() { // 不要附加到 btn 上，否则点击时会执行两次
          processSwitch()
        }
        atr.appendChild(btn)

        const aid = await _self.method.getAid()
        bus = { btn, cb, aid }
        initButtonStatus()
        original.parentElement.style.display = 'none'

        bus.pathname = location.pathname
        window.addEventListener('urlchange', async function() {
          if (location.pathname == bus.pathname) return // 并非切换视频（如切分 P）
          bus.pathname = location.pathname
          bus.aid = await api.wait.waitForConditionPassed({
            condition: async () => {
              // 要等 aid 跟之前存的不一样，才能说明是切换成功后获取到的 aid
              const aid = await _self.method.getAid()
              if (aid && aid != bus.aid) {
                return aid
              }
            },
          })
          let reloaded = false
          gm.searchParams = new URL(location.href).searchParams
          const removed = await _self.processAutoRemove()
          if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.anypage) {
            await _self.method.updateRemoveHistoryData(true)
            reloaded = true
          }
          const status = removed ? false : await _self.method.getVideoWatchlaterStatusByAid(bus.aid, !reloaded)
          btn.added = status
          cb.checked = status
        })
      })

      /**
       * 初始化按钮的稍后再看状态
       */
      async function initButtonStatus() {
        const setStatus = async () => {
          const status = await _self.method.getVideoWatchlaterStatusByAid(bus.aid)
          bus.btn.added = status
          bus.cb.checked = status
        }
        const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove`) == 'true'
        const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) == 'true'
        if ((!alwaysAutoRemove && !spRemove) || spDisableRemove) {
          setStatus()
        }
        // 如果当前视频应当被移除，那就不必读取状态了
        // 注意，哪处代码先执行不确定，不过从理论上来说这里应该是会晚执行
        // 当然，自动移除的操作有可能会失败，但两处代码联动太麻烦了，还会涉及到切换其他视频的问题，综合考虑之下对这种小概率事件不作处理
      }

      /**
       * 处理视频状态的切换
       */
      async function processSwitch() {
        const btn = bus.btn
        const cb = bus.cb
        const note = btn.added ? '从稍后再看移除' : '添加到稍后再看'
        const success = await _self.method.switchVideoWatchlaterStatus(bus.aid, !btn.added)
        if (success) {
          btn.added = !btn.added
          cb.checked = btn.added
          api.message.create(`${note}成功`)
        } else {
          cb.checked = btn.added
          api.message.create(`${note}失败${!btn.added ? '，可能是因为不支持当前稿件类型（如互动视频）' : ''}`)
        }
      }
    }

    /**
     * 稍后再看模式重定向至正常模式播放
     */
    async redirect() {
      window.stop() // 停止原页面的加载
      // 这里必须从 URL 反推，其他方式都比这个慢
      try {
        let id = null
        let vid = this.method.getVid()
        if (vid) {
          if (vid.type == 'aid') {
            id = 'av' + vid.id
          } else {
            id = vid.id
          }
        } else { // 如果为空就是以 watchlater/ 直接结尾，等同于稍后再看中的第一个视频
          const resp = await api.web.request({
            method: 'GET',
            url: gm.url.api_queryWatchlaterList,
          })
          const json = JSON.parse(resp.responseText)
          id = json.data.list[0].bvid
        }
        location.replace(`${gm.url.page_videoNormalMode}/${id}${location.search}${location.hash}`)
      } catch (e) {
        api.logger.error(e)
        api.message.alert(`重定向错误，如果重新加载页面依然出错请联系脚本作者：${GM_info.script.supportURL}`)
        const result = api.message.confirm('是否临时关闭模式切换功能？')
        if (result) {
          const url = new URL(location.href)
          url.searchParams.set(`${gmId}_disable_redirect`, 'true')
          location.replace(url.href)
        } else {
          location.replace(gm.url.page_watchlaterList)
        }
      }
    }

    /**
     * 对稍后再看列表页面进行处理
     */
    async processWatchlaterList() {
      const _self = this
      const sortable = gm.config.autoSort != Enums.autoSort.default || gm.config.listSortControl
      const needInfo = gm.config.listSearch || sortable
      let autoRemoveControl = null
      if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
        autoRemoveControl = await api.wait.waitQuerySelector('#gm-list-auto-remove-control')
      }
      const listContainer = await api.wait.waitQuerySelector('.watch-later-list')
      const listBox = await api.wait.waitQuerySelector('.list-box', listContainer)
      listBox.querySelectorAll('.av-item').forEach(item => {
        needInfo && extractInfo(item)
        item.querySelectorAll('a:not([class=user])').forEach(link => processLink(item, link, autoRemoveControl))
        processDelBtn(item, item.querySelector('.btn-del'))
      })
      _self.updateWatchlaterListTotal()

      const obItemChange = new MutationObserver(api.tool.debounce(() => {
        _self.updateWatchlaterListTotal()
        _self.triggerWatchlaterListContentLoad()
      }, 500))
      obItemChange.observe(listBox.firstElementChild, { childList: true })
      const obListBoxRemove = new MutationObserver((mutations, observer) => {
        // 不能检测 listBox 是否在 listContainer 中
        // 因为有可能删除 listBox，然后添加进 empty 块
        // 也有可能是将 listBox 变成 empty 块
        if (!listContainer.querySelector('.list-box')) {
          _self.updateWatchlaterListTotal(0, 0)
          observer.disconnect()
        }
      })
      obListBoxRemove.observe(listContainer, { childList: true })

      if (sortable) {
        const sortControl = await api.wait.waitQuerySelector('#gm-list-sort-control')
        if (sortControl.value != sortControl.prevVal) {
          _self.sortWatchlaterList()
        }
      }

      /**
       * 根据 `autoRemove` 处理链接
       * @param {HTMLElement} base 基元素
       * @param {HTMLAnchorElement} link 链接元素
       * @param {HTMLElement} [arc] 自动移除按钮，为 `null` 时表示彻底禁用自动移除功能
       */
      function processLink(base, link, arc) {
        link.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
        if (arc) {
          if (link.href && gm.regex.page_videoWatchlaterMode.test(link.href)) { // 视频被和谐或其他特殊情况
            link.addEventListener('mousedown', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (!this._originalHref) {
                  this._originalHref = this.href
                }
                if (arc.autoRemove) {
                  if (gm.config.autoRemove != Enums.autoRemove.always) {
                    const url = new URL(this.href)
                    url.searchParams.set(`${gm.id}_remove`, 'true')
                    this.href = url.href
                  } else {
                    this.href = this._originalHref
                  }
                } else {
                  if (gm.config.autoRemove == Enums.autoRemove.always) {
                    const url = new URL(this.href)
                    url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                    this.href = url.href
                  } else {
                    this.href = this._originalHref
                  }
                }
              }
            })
            link.addEventListener('mouseup', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (arc.autoRemove) {
                  // 添加移除样式并移动至列表末尾
                  api.dom.addClass(base, 'gm-watchlater-item-deleted')
                  setTimeout(() => {
                    base.parentElement.appendChild(base)
                    if (sortable) {
                      _self.sortWatchlaterList(true)
                    }
                  }, 100)
                }
              }
            })
          } else {
            link.href = gm.url.noop
            link.target = '_self'
            link.style.cursor = 'not-allowed'
          }
        }
      }

      /**
       * 处理原生的移除按钮
       * @param {HTMLElement} base 基元素
       * @param {HTMLElement} del 移除按钮元素
       */
      function processDelBtn(base, del) {
        // 捕获拦截，将其克隆节点添加移除样式后添加至列表末尾
        del.addEventListener('click', function() {
          // 在排序之后点击移除按钮，click 事件会神奇地触发两次
          if (api.dom.containsClass(base, 'gm-watchlater-item-deleted-origin')) return
          const cloned = base.cloneNode(true)
          api.dom.addClass(base, 'gm-watchlater-item-deleted-origin')
          api.dom.addClass(cloned, 'gm-watchlater-item-deleted')
          base.parentElement.appendChild(cloned)
          needInfo && extractInfo(cloned)
          sortable && _self.sortWatchlaterList(true)
        }, true)
      }

      /**
       * 提取列表项信息
       * @param {HTMLElement} item 列表项
       */
      function extractInfo(item) {
        item.serial = parseInt(item.querySelector('.key').textContent)
        item.vTitle = item.querySelector('.t').textContent
        item.uploader = item.querySelector('.user').textContent
        item.duration = (function(text) {
          if (!text) return Infinity // 有分 P 直接拉到最高
          let result = 0
          const factors = [24 * 3600, 3600, 60, 1]
          const parts = text.split(':')
          while (parts.length > 0) {
            result += parts.pop() * factors.pop()
          }
          return result
        })(item.querySelector('.corner')?.textContent)
        item.progress = item.querySelector('.looked') ? 1 : 0
      }
    }

    /**
     * 对稍后再看列表进行搜索
     */
    async searchWatchlaterList() {
      const search = await api.wait.waitQuerySelector('#gm-list-search input')
      let val = search.value.trim()
      const match = str => str && val?.test(str)
      if (val.length > 0) {
        try {
          val = val.replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex
            .replaceAll('?', '.').replaceAll('*', '.+') // 通配符
          val = new RegExp(val, 'i')
        } catch (e) {
          val = null
        }
      } else {
        val = null
      }

      const listBox = await api.wait.waitQuerySelector('.watch-later-list .list-box')
      const items = listBox.querySelectorAll('.av-item')
      for (const item of items) {
        let valid = false
        if (val) {
          if (match(item.vTitle)) {
            valid = true
          } else if (match(item.uploader)) {
            valid = true
          }
        } else {
          valid = true
        }
        if (valid) {
          api.dom.removeClass(item, 'gm-search-hide')
        } else {
          api.dom.addClass(item, 'gm-search-hide')
        }
      }
    }

    /**
     * 对稍后再看列表页面进行排序
     * @param {boolean} [onlyDeleted] 是否只对移除列表排序
     */
    async sortWatchlaterList(onlyDeleted) {
      const sortControl = await api.wait.waitQuerySelector('#gm-list-sort-control')
      const type = sortControl.value
      sortControl.prevVal = type
      let reverse = type.endsWith(':R')
      const k = type.replace(/:R$/, '')

      const listBox = await api.wait.waitQuerySelector('.watch-later-list .list-box')
      const container = listBox.querySelector('.av-item').parentElement
      const lists = []
      if (!onlyDeleted) {
        lists.push(Array.from(listBox.querySelectorAll('.av-item:not(.gm-watchlater-item-deleted, .gm-watchlater-item-deleted-origin)')))
      }
      lists.push(Array.from(listBox.querySelectorAll('.av-item.gm-watchlater-item-deleted:not(.gm-watchlater-item-deleted-origin)')))
      for (const items of lists) {
        items.sort((a, b) => {
          let result = 0
          const va = a[k]
          const vb = b[k]
          if (typeof va == 'string') {
            result = va.localeCompare(vb)
          } else if (!isNaN(va)) {
            result = va - vb
          }
          return reverse ? -result : result
        })
        for (const item of items) {
          container.appendChild(item)
        }
      }
    }

    /**
     * 触发列表页面内容加载
     */
    triggerWatchlaterListContentLoad() {
      window.dispatchEvent(new Event('scroll'))
    }

    /**
     * 更新列表页面上方的视频总数统计
     * @param {number} [total] 列表非移除视频总数，默认为自动获取
     * @param {number} [all] 列表视频总数，默认为自动获取
     */
    async updateWatchlaterListTotal(total, all) {
      const container = await api.wait.waitQuerySelector('.watch-later-list')
      const listBox = (typeof total == 'undefined' && typeof all == 'undefined') && await api.wait.waitQuerySelector('.list-box', container)
      const elTotal = await api.wait.waitQuerySelector('header .t em')
      all = all ?? listBox.querySelectorAll('.av-item:not(.gm-watchlater-item-deleted-origin, .gm-search-hide)').length
      total = total ?? all - listBox.querySelectorAll('.gm-watchlater-item-deleted:not(.gm-watchlater-item-deleted-origin, .gm-search-hide)').length
      elTotal.textContent = `（${total}/${all}）`

      const emptyBlocks = container.querySelectorAll('.abnormal-item') // 脚本加进来的，及B站加进来的，可能有两个
      if (all > 0) {
        for (const empty of emptyBlocks) {
          empty.style.display = 'none'
        }
      } else {
        if (emptyBlocks.length > 0) {
          emptyBlocks[0].style.display = ''
        } else {
          const empty = container.appendChild(document.createElement('div'))
          empty.outerHTML = '<div class="abnormal-item"><img src="//s1.hdslb.com/bfs/static/jinkela/watchlater/asserts/emptylist.png" class="pic"><div class="txt"><p>稍后再看列表还是空的哦，你可以通过以上方式添加~</p></div></div>'
        }
      }
    }

    /**
     * 根据 URL 上的查询参数作进一步处理
     */
    async processSearchParams() {
      const _self = this
      if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
        // 播放页面（正常模式）
        await _self.processAutoRemove()
      } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 播放页面（稍后再看模式）
        // 推迟一段时间执行，否则稍后再看模式播放页会因为检测不到视频在稍后再看中而出错
        await _self.processAutoRemove(5000)
      }
    }

    /**
     * 根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
     * @param {number} [delay=0] 延迟执行（单位：ms）
     * @returns {Promise<boolean>} 执行后视频是否已经不在稍后再看中（可能是在本方法内被移除，也可能是本身就不在）
     */
    async processAutoRemove(delay = 0) {
      try {
        const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove`) == 'true'
        const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) == 'true'
        if ((alwaysAutoRemove || spRemove) && !spDisableRemove) {
          const _self = this
          const aid = await _self.method.getAid()
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          const success = await _self.method.switchVideoWatchlaterStatus(aid, false)
          if (!success) {
            api.message.create('从稍后再看移除失败')
          }
          return success
        }
      } catch (e) {
        api.logger.error(e)
      }
      return false
    }

    /**
     * 根据 `removeHistorySavePoint` 保存稍后再看历史数据
     */
    processWatchlaterListDataSaving() {
      const _self = this
      switch (gm.config.removeHistorySavePoint) {
        case Enums.removeHistorySavePoint.list:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            _self.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.listAndMenu:
        default:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            // 从入口打开，而设置为 listAndMenu，则数据必然刚刚刷新过
            if (gm.searchParams.get(`${gm.id}_from_header`) != 'true') {
              _self.method.updateRemoveHistoryData()
            }
          }
          break
        case Enums.removeHistorySavePoint.anypage:
          if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
            // anypage 时弹出入口菜单不会引起数据刷新，不必检测 ${gm.id}_from_header
            _self.method.updateRemoveHistoryData()
          }
          break
      }
    }

    /**
     * 调整列表页面的 UI
     */
    async adjustWatchlaterListUI() {
      const _self = this
      const r_con = await api.wait.waitQuerySelector('.watch-later-list header .r-con')
      // 页面上本来就存在的「全部播放」按钮不要触发重定向
      const setPlayAll = el => {
        el.href = gm.url.page_watchlaterPlayAll
        el.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
      }
      const playAll = r_con.children[0]
      if (api.dom.containsClass(playAll, 's-btn')) {
        // 理论上不会进来
        setPlayAll(playAll)
      } else {
        const ob = new MutationObserver((records, observer) => {
          setPlayAll(records[0].target)
          observer.disconnect()
        })
        ob.observe(playAll, { attributeFilter: ['href'] })
      }
      // 在列表页面加入「移除记录」
      if (gm.config.removeHistory) {
        const removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.textContent = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => script.openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      // 在列表页面加如「增强设置」
      const plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.textContent = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => script.openUserSetting() // 要避免 MouseEvent 的传递
      // 移除「一键清空」按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除「移除已观看视频」按钮
      if (gm.config.removeButton_removeWatched) {
        r_con.children[2].style.display = 'none'
      }

      // 增加搜索框
      if (gm.config.listSearch) {
        api.dom.addStyle(`
          #gm-list-search.gm-search {
            display: inline-block;
            font-size: 1.6em;
            line-height: 2em;
            margin: 10px 21px 0;
            padding: 0 0.5em;
            border-radius: 3px;
            transition: box-shadow ${gm.const.fadeTime}ms ease-in-out;
          }
          #gm-list-search.gm-search:hover,
          #gm-list-search.gm-search.gm-active {
            box-shadow: var(--${gm.id}-box-shadow);
          }
          #gm-list-search.gm-search input[type=text] {
            border: none;
            width: 18em;
          }
        `)
        const searchContainer = r_con.insertAdjacentElement('afterend', document.createElement('div'))
        searchContainer.className = 'gm-list-search-container'
        searchContainer.innerHTML = `
          <div id="gm-list-search" class="gm-search">
            <input type="text" placeholder="点击以在列表中搜索... 支持通配符 ( ? * )">
            <div class="gm-search-clear">✖</div>
          </div>
        `
        const searchBox = searchContainer.firstElementChild
        const search = searchBox.children[0]
        const searchClear = searchBox.children[1]

        search.addEventListener('mouseenter', function() {
          this.focus()
        })
        search.addEventListener('input', function() {
          const m = /^\s+(.*)/.exec(this.value)
          if (m) {
            this.value = m[1]
            this.setSelectionRange(0, 0)
          }
          if (this.value.length > 0) {
            api.dom.addClass(searchBox, 'gm-active')
            searchClear.style.visibility = 'visible'
          } else {
            api.dom.removeClass(searchBox, 'gm-active')
            searchClear.style.visibility = ''
          }
        })
        search.addEventListener('input', api.tool.throttle(async () => {
          await _self.searchWatchlaterList()
          await _self.updateWatchlaterListTotal()
          _self.triggerWatchlaterListContentLoad()
        }, gm.const.inputThrottleWait))
        searchClear.onclick = function() {
          search.value = ''
          search.dispatchEvent(new Event('input'))
        }
      }

      // 增加排序控制
      {
        const sortControlButton = r_con.insertAdjacentElement('afterbegin', document.createElement('div'))
        const control = sortControlButton.appendChild(document.createElement('select'))
        sortControlButton.className = 'gm-list-sort-control-container'
        control.id = 'gm-list-sort-control'
        control.innerHTML = `
          <option value="${Enums.sortType.default}" selected>排序：默认</option>
          <option value="${Enums.sortType.defaultR}">排序：默认↓</option>
          <option value="${Enums.sortType.duration}">排序：时长</option>
          <option value="${Enums.sortType.durationR}">排序：时长↓</option>
          <option value="${Enums.sortType.progress}">排序：进度</option>
          <option value="${Enums.sortType.uploader}">排序：UP 主</option>
          <option value="${Enums.sortType.title}">排序：标题</option>
        `
        control.prevVal = control.value

        if (gm.config.autoSort != Enums.autoSort.default) {
          let type = gm.config.autoSort
          if (type == Enums.autoSort.auto) {
            type = GM_getValue('autoSort_auto')
            if (!type) {
              type = Enums.sortType.default
              GM_setValue('autoSort_auto', type)
            }
          }
          control.value = type
        }

        if (gm.config.listSortControl) {
          /*
           * 在 control 外套一层，借助这层给 control 染色的原因是：
           * 如果不这样做，那么点击 control 弹出的下拉框与 control 之间有几个像素的距离，鼠标从 control 移动到下拉框
           * 的过程中，若鼠标移动速度较慢，会使 control 脱离 hover 状态。
           * 不管是标准还是浏览器的的锅：凭什么鼠标移动到 option 上 select「不一定」是 hover 状态——哪怕设计成「一定不」
           * 都是合理的。
           */
          api.dom.addStyle(`
            .gm-list-sort-control-container {
              display: inline-block;
              padding-bottom: 5px;
            }
            .gm-list-sort-control-container:hover select {
              background: #00a1d6;
              color: #fff;
            }
            .gm-list-sort-control-container select {
              appearance: none;
              text-align-last: center;
              line-height: 16.6px;
            }
            .gm-list-sort-control-container option {
              background: var(--${gm.id}-background-color);
              color: var(--${gm.id}-text-color);
            }
          `)
          control.className = 's-btn gm-s-btn'

          control.addEventListener('change', function() {
            if (gm.config.autoSort == Enums.autoSort.auto) {
              GM_setValue('autoSort_auto', this.value)
            }
            _self.sortWatchlaterList()
          })
        } else {
          sortControlButton.style.display = 'none'
        }
      }

      // 增加自动移除控制器
      if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
        api.dom.addStyle(`
          #gm-list-auto-remove-control {
            background: #fff;
            color: #00a1d6;
          }
          #gm-list-auto-remove-control[enabled] {
            background: #00a1d6;
            color: #fff;
          }
        `)
        const autoRemove = gm.config.autoRemove == Enums.autoRemove.always || gm.config.autoRemove == Enums.autoRemove.openFromList
        const autoRemoveControl = r_con.insertAdjacentElement('afterbegin', document.createElement('div'))
        autoRemoveControl.id = 'gm-list-auto-remove-control'
        autoRemoveControl.textContent = '自动移除'
        autoRemoveControl.title = '临时切换在当前页面打开视频后是否将其自动移除出「稍后再看」。若要默认开启/关闭自动移除功能，请在「用户设置」中配置。'
        autoRemoveControl.className = 's-btn gm-s-btn'
        autoRemoveControl.autoRemove = autoRemove
        if (autoRemove) {
          autoRemoveControl.setAttribute('enabled', '')
        }
        autoRemoveControl.addEventListener('click', function() {
          if (this.autoRemove) {
            autoRemoveControl.removeAttribute('enabled')
            api.message.create('已临时关闭自动移除功能')
          } else {
            autoRemoveControl.setAttribute('enabled', '')
            api.message.create('已临时开启自动移除功能')
          }
          this.autoRemove = !this.autoRemove
        })
      }
    }

    /**
     * 隐藏「收藏」中的「稍后再看」
     */
    async hideWatchlaterInCollect() {
      api.wait.waitQuerySelector('.user-con .mini-favorite').then(fav => {
        const collect = fav.parentElement
        const process = function() {
          api.wait.waitQuerySelector('[role=tooltip] .tab-item [title=稍后再看]', document, true).then(el => {
            el.parentElement.style.display = 'none'
            collect.removeEventListener('mouseover', process) // 确保移除后再解绑
          }).catch(() => {}) // 有时候鼠标经过收藏也没弹出来，不知道什么原因，就不报错了
        }
        collect.addEventListener('mouseover', process)
      })
    }

    /**
     * 添加弹出菜单的滚动条样式
     */
    addMenuScrollbarStyle() {
      const popup = `#${gm.id} .gm-entrypopup .gm-entry-list`
      const tooltip = '[role=tooltip]'
      const dynamic = '#app > .out-container > .container'
      switch (gm.config.menuScrollbarSetting) {
        case Enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果。
          api.dom.addStyle(`
            :root {
              --${gm.id}-scrollbar-background-color: transparent;
              --${gm.id}-scrollbar-thumb-color: #0000002b;
            }

            ${popup}::-webkit-scrollbar,
            ${tooltip} ::-webkit-scrollbar,
            ${dynamic}::-webkit-scrollbar {
              width: 6px;
              height: 6px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}::-webkit-scrollbar-thumb,
            ${tooltip} ::-webkit-scrollbar-thumb,
            ${dynamic}::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}:hover::-webkit-scrollbar-thumb,
            ${tooltip} :hover::-webkit-scrollbar-thumb,
            ${dynamic}:hover::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--${gm.id}-scrollbar-thumb-color);
            }

            ${popup}::-webkit-scrollbar-corner,
            ${tooltip} ::-webkit-scrollbar-corner,
            ${dynamic}::-webkit-scrollbar-corner {
              background-color: var(--${gm.id}-scrollbar-background-color);
            }
          `)
          return
        case Enums.menuScrollbarSetting.hidden:
          api.dom.addStyle(`
            ${popup}::-webkit-scrollbar,
            ${tooltip} ::-webkit-scrollbar,
            ${dynamic}::-webkit-scrollbar {
              display: none;
            }
          `)
          return
        case Enums.menuScrollbarSetting.original:
        default:
          return
      }
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      if (self == top) {
        this.addMenuScrollbarStyle()
        // 通用样式
        api.dom.addStyle(`
          :root {
            --${gm.id}-text-color: #0d0d0d;
            --${gm.id}-text-bold-color: #3a3a3a;
            --${gm.id}-light-text-color: white;
            --${gm.id}-hint-text-color: gray;
            --${gm.id}-light-hint-text-color: #909090;
            --${gm.id}-hint-text-emphasis-color: #666666;
            --${gm.id}-hint-text-hightlight-color: #555555;
            --${gm.id}-background-color: white;
            --${gm.id}-background-hightlight-color: #ebebeb;
            --${gm.id}-update-hightlight-color: ${gm.const.updateHighlightColor};
            --${gm.id}-update-hightlight-hover-color: red;
            --${gm.id}-border-color: black;
            --${gm.id}-light-border-color: #e7e7e7;
            --${gm.id}-shadow-color: #000000bf;
            --${gm.id}-text-shadow-color: #00000080;
            --${gm.id}-hightlight-color: #0075ff;
            --${gm.id}-important-color: red;
            --${gm.id}-warn-color: #e37100;
            --${gm.id}-disabled-color: gray;
            --${gm.id}-link-visited-color: #551a8b;
            --${gm.id}-scrollbar-background-color: transparent;
            --${gm.id}-scrollbar-thumb-color: #0000002b;
            --${gm.id}-box-shadow: #00000033 0px 3px 6px;
            --${gm.id}-opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
            --${gm.id}-opacity-fade-quick-transition: opacity ${gm.const.fadeTime}ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
          }
  
          #${gm.id} {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} * {
            box-sizing: content-box;
          }
  
          #${gm.id} .gm-entrypopup {
            font-size: 12px;
            line-height: normal;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            position: absolute;
            z-index: 14000;
            user-select: none;
            width: 32em;
            padding-top: 1em;
          }
          #${gm.id} .gm-entrypopup .gm-popup-arrow {
            position: absolute;
            top: calc(1em - 6px);
            left: calc(16em - 6px);
            width: 0;
            height: 0;
            border-width: 6px;
            border-top-width: 0;
            border-style: solid;
            border-color: transparent;
            border-bottom-color: #dfdfdf; /* 必须在 border-color 后 */
            z-index: 1;
          }
          #${gm.id} .gm-entrypopup .gm-popup-arrow::after {
            content: " ";
            position: absolute;
            top: 1px;
            width: 0;
            height: 0;
            margin-left: -6px;
            border-width: 6px;
            border-top-width: 0;
            border-style: solid;
            border-color: transparent;
            border-bottom-color: var(--${gm.id}-background-color); /* 必须在 border-color 后 */
          }
          #${gm.id} .gm-entrypopup .gm-entrypopup-page {
            position: relative;
            border-radius: 4px;
            border: none;
            box-shadow: var(--${gm.id}-box-shadow);
            background-color: var(--${gm.id}-background-color);
            overflow: hidden;
          }
          #${gm.id} .gm-entrypopup .gm-popup-header {
            position: relative;
            height: 2.8em;
            border-bottom: 1px solid var(--${gm.id}-light-border-color);
          }
          #${gm.id} .gm-entrypopup .gm-popup-total {
            position: absolute;
            line-height: 2.6em;
            right: 1.3em;
            top: 0;
            font-size: 1.2em;
            color: var(--${gm.id}-hint-text-color);
          }
  
          #${gm.id} .gm-entrypopup .gm-entry-list {
            position: relative;
            height: 42em;
            overflow-y: auto;
            padding: 0.2em 0;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list.gm-entry-removed-list {
            border-top: 3px solid var(--${gm.id}-light-border-color);
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list-empty {
            position: absolute;
            display: none;
            top: 20%;
            left: calc(50% - 7em);
            line-height: 4em;
            width: 14em;
            font-size: 1.4em;
            text-align: center;
            color: var(--${gm.id}-hint-text-color);
          }
  
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item {
            display: flex;
            height: 4.4em;
            padding: 0.5em 1em;
            color: var(--${gm.id}-text-color);
            font-size: 1.15em;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid {
            cursor: not-allowed;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed {
            filter: grayscale(1);
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-left {
            position: relative;
            flex: 0;
            cursor: default;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-cover {
            width: 7.82em;
            height: 4.40em;
            border-radius: 2px;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-switcher {
            position: absolute;
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAACXBIWXMAAAsSAAALEgHS3X78AAAA/ElEQVRoge3bsQ3CMBSE4bOBAmZIzSLUrMECjMACtLBGKgq2yQ4uHzJKgaIghHHAZ+6rQfKvnCIRBWdmiJxzWwAbAEtwCwCuZtbeuwCsAOwBNORhQ52ZHXx/1WqLi5q4yngFjxXM8pngK46Llr6AQ0xKgewUyE6B7BTIbj7F+c1sl/I959w591k0UXbx18Tp3YbUCX4qZcKaKLukiY55nO3YlIazfvWZXHdUTZSdAtkpkJ0C2SmQnQLZKZCdAtkpkN3PHvx+68mcJsou21O1Ummi7BTIToHsFMjuLwJDAeeYSpgBWABY19mHi+/fTu8KOExu8aX0tu6/FQC4AVY1Ql6j10UHAAAAAElFTkSuQmCC);
            background-size: contain;
            width: 34px;
            height: 34px;
            top: calc(2.2em - 17px);
            left: calc(3.9em - 17px);
            z-index: 2;
            display: none;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-switcher {
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAwFBMVEUAAAAGBgavr69EREQUFBQ1NTUODg7t7e3FxcV0dHRbW1sAAAAAAAAAAAD+/v77+/v4+Pj09PTj4+P8/PzV1dWpqamSkpIhISH19fXX19fLy8ulpaWdnZ1kZGRVVVUsLCz6+vrm5uba2tq9vb20tLSsrKyXl5eMjIx+fn54eHhsbGxpaWk+Pj4AAAAAAADv7+/e3t7AwMC3t7ehoaFLS0vo6OjR0dHOzs7CwsKCgoKCgoJiYmLp6enMzMywsLD////DVMIGAAAAP3RSTlOZmtOrnqec8927sopkEf38+ffu/eXPxqH45+DOyrWwpPvv6NnV0cjEv724t6qPAPTr2tbNru/j4tvAv7Tw4dTgAD9iAAABpElEQVRIx+ST13KCUBiEDyCCBRBQsaHGHrvp/Xv/twpDTBgRonjr3u0w38zu8h+xNsolkVGlsrEWxkpcoJUhyuISBVjpIi7Arli9bmE6mb0rUhZI6tZu2KuxK+TO5RYOB2pM8udgShWASlOXa8MnDYDN7DRX6AOVkf/bTemEqe9OdW0DluwdNH7VgKZ3knNUEVN+CGz/K3oLtJJGrJugp3MPFrSSy7wBnVRwAE7aTxuDq6YNCpaaehRN2KV8eoRaNMh8GesBKIlgEewoaAtTPoytw0gIXz4KJYMcORfQ5n/Wy4kuaMKHzzioQTFyhNJ7P27ZMNuSDb4Noxingi3FQSpTab8bWx0+YOMdV6yKIxAGSuCkZ6Dv9sEsJlzNSxKIex/ejgUkXkEdxokgLMJn4gBUpcygyH+BHYyVMWo4w/eMwXFIfOCgAVKiAxMQTgCYAH+S44MkOXRAOJGbYyRyHXU24rIVWgjqCNgbkZWRRYA+JrfoYKaksKK8eKS8QCZcBVBe6VBezRGuWGlalSMaD2KQxsMooCMgu6FLdtOa7MY82d0HAP3jZ1lFdjimAAAAAElFTkSuQmCC);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-switcher {
            display: unset;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-duration,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration > * {
            position: absolute;
            bottom: 0;
            right: 0;
            background: var(--${gm.id}-text-shadow-color);
            color: var(--${gm.id}-light-text-color);
            border-radius: 2px;
            padding: 2px 3px;
            font-size: 0.8em;
            z-index: 1;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration > * {
            transition: var(--${gm.id}-opacity-fade-quick-transition);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration :first-child,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP:hover .gm-card-duration :last-child {
            opacity: 0;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP:hover .gm-card-duration :first-child,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration :last-child {
            opacity: 1;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-right {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            margin-left: 0.8em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-title {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
            text-align: justify;
            height: 2.8em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-title {
            text-decoration: line-through;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader {
            font-size: 0.8em;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            width: fit-content;
            max-width: 21em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader:hover {
            text-decoration: underline;
            font-weight: bold;
            color: var(--${gm.id}-text-bold-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress {
            position: absolute;
            bottom: 0;
            right: 0;
            font-size: 0.8em;
            color: var(--${gm.id}-hint-text-color);
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-progress {
            color: var(--${gm.id}-hightlight-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress::before {
            content: "▶";
            padding-right: 1px;
          }
  
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item {
            display: block;
            color: var(--${gm.id}-text-color);
            font-size: 1.2em;
            padding: 0.5em 1em;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:not(:last-child) {
            border-bottom: 1px solid var(--${gm.id}-light-border-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid:hover {
            cursor: not-allowed;
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-removed {
            text-decoration: line-through;
            color: var(--${gm.id}-hint-text-color);
          }
  
          #${gm.id} .gm-entrypopup .gm-entry-bottom {
            display: flex;
            border-top: 1px solid var(--${gm.id}-light-border-color);
            height: 3em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button {
            flex: 1;
            text-align: center;
            padding: 0.6em 0;
            font-size: 1.2em;
            cursor: pointer;
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:not([enabled]) {
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[disabled],
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[disabled]:hover {
            color: var(--${gm.id}-disabled-color);
            cursor: not-allowed;
          }

          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-select {
            position: relative;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-options {
            position: absolute;
            bottom: 1.8em;
            left: calc(50% - 2.5em);
            width: 5em;
            border-radius: 4px;
            box-shadow: var(--${gm.id}-box-shadow);
            background-color: var(--${gm.id}-background-color);
            color: var(--${gm.id}-text-color);
            padding: 0.15em 0;
            display: none;
            opacity: 0;
            transition: var(--${gm.id}-opacity-fade-quick-transition);
            z-index: 10;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option {
            padding: 0.15em 0.6em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option:hover {
            color: var(--${gm.id}-hightlight-color);
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option.gm-option-selected {
            font-weight: bold;
          }

          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl]:not([disabled]),
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl]:not([disabled]):hover {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button.gm-popup-auto-remove[fn=autoRemoveControl]:not([disabled]) {
            color: var(--${gm.id}-hightlight-color);
          }
  
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:hover,
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:hover {
            color: var(--${gm.id}-hightlight-color);
            background-color: var(--${gm.id}-background-hightlight-color);
          }
  
          #${gm.id} .gm-setting {
            font-size: 12px;
            line-height: normal;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            position: fixed;
            z-index: 15000;
            user-select: none;
          }
  
          #${gm.id} .gm-setting #gm-setting-page {
            background-color: var(--${gm.id}-background-color);
            border-radius: 10px;
            z-index: 65535;
            min-width: 53em;
            padding: 1em 1.4em;
            transition: top 100ms, left 100ms;
          }
  
          #${gm.id} .gm-setting #gm-maintitle * {
            cursor: pointer;
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-setting #gm-maintitle:hover * {
            color: var(--${gm.id}-hightlight-color);
          }
  
          #${gm.id} .gm-setting .gm-items {
            margin: 0 0.2em;
            padding: 0 1.8em 0 2.2em;
            font-size: 1.2em;
            max-height: 66vh;
            overflow-y: auto;
          }
  
          #${gm.id} .gm-setting table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          #${gm.id} .gm-setting td {
            position: relative;
          }
          #${gm.id} .gm-setting .gm-item td:first-child {
            vertical-align: top;
            padding-right: 0.6em;
            font-weight: bold;
            color: var(--${gm.id}-text-bold-color);
          }
          #${gm.id} .gm-setting .gm-item:not(:first-child) td {
            padding-top: 0.5em;
          }
          #${gm.id} .gm-setting td > * {
            padding: 0.2em;
            border-radius: 0.2em;
          }
  
          #${gm.id} .gm-setting .gm-item:hover {
            color: var(--${gm.id}-hightlight-color);
          }
  
          #${gm.id} .gm-setting .gm-subitem[disabled] {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
            color: var(--${gm.id}-hightlight-color);
          }
  
          #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitems {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem {
            display: inline-block;
            padding-right: 8px;
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem:hover {
            color: var(--${gm.id}-hightlight-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] .gm-lineitem {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem input[type=checkbox] {
            margin-left: 2px;
            vertical-align: -1px;
          }
  
          #${gm.id} .gm-setting td > * {
            display: flex;
            align-items: flex-end;
          }
          #${gm.id} .gm-setting input[type=checkbox] {
            margin-left: auto;
          }
          #${gm.id} .gm-setting input[type=text] {
            border-width: 0 0 1px 0;
            width: 3.4em;
            text-align: right;
            padding: 0 0.2em;
            margin-left: auto;
          }
          #${gm.id} .gm-setting select {
            border-width: 0 0 1px 0;
            cursor: pointer;
          }
  
          #${gm.id} .gm-setting .gm-information {
            margin: 0 0.4em;
            cursor: pointer;
          }
          #${gm.id} .gm-setting [disabled] .gm-information {
            cursor: not-allowed;
          }
  
          #${gm.id} .gm-setting .gm-warning {
            position: absolute;
            color: var(--${gm.id}-warn-color);
            font-size: 1.4em;
            line-height: 1em;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            cursor: pointer;
          }
          #${gm.id} .gm-setting .gm-warning.gm-trailing {
            position: static;
            margin-left: 0.5em;
          }
          #${gm.id} .gm-setting .gm-warning:not(.gm-trailing) {
            right: -1.1em;
          }
  
          #${gm.id} .gm-setting.gm-hideDisabledSubitems #gm-setting-page:not([setting-type]) [disabled] {
            display: none;
          }
  
          #${gm.id} .gm-history {
            font-size: 12px;
            line-height: normal;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            position: fixed;
            z-index: 15000;
            user-select: none;
          }
  
          #${gm.id} .gm-history .gm-history-page {
            background-color: var(--${gm.id}-background-color);
            border-radius: 10px;
            z-index: 65535;
            height: 75vh;
            width: 60vw;
            min-width: 40em;
            min-height: 50em;
            transition: top 100ms, left 100ms;
          }
  
          #${gm.id} .gm-history .gm-comment {
            margin: 0 2em;
            color: var(--${gm.id}-hint-text-color);
            text-indent: 2em;
          }
          #${gm.id} .gm-history .gm-comment span,
          #${gm.id} .gm-history .gm-comment input {
            padding: 0 0.2em;
            font-weight: bold;
            color: var(--${gm.id}-hint-text-emphasis-color);
          }
          #${gm.id} .gm-history .gm-comment input{
            text-align: center;
            width: 3.5em;
            border-width: 0 0 1px 0;
          }
  
          #${gm.id} .gm-history .gm-content {
            margin: 0.6em 0.2em 2em 0.2em;
            padding: 0 1.8em;
            font-size: 1.2em;
            text-align: center;
            line-height: 1.6em;
            overflow-y: auto;
            position: absolute;
            top: 8em;
            bottom: 0;
            left: 0;
            right: 0;
            opacity: 0;
            user-select: text;
          }
          #${gm.id} .gm-history .gm-content > * {
            position: relative;
            margin: 1.6em 2em;
          }
          #${gm.id} .gm-history .gm-content a {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-history .gm-content input[type=checkbox] {
            position: absolute;
            right: -2em;
            height: 1.5em;
            width: 1em;
            cursor: pointer;
          }
          #${gm.id} .gm-history .gm-content .gm-history-date {
            font-size: 0.5em;
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-history .gm-content > *:hover input[type=checkbox] {
            filter: brightness(0.9);
          }
          #${gm.id} .gm-history .gm-content > *:hover a {
            font-weight: bold;
            color: var(--${gm.id}-hightlight-color);
          }
  
          #${gm.id} .gm-bottom {
            margin: 1.4em 2em 1em 2em;
            text-align: center;
          }
  
          #${gm.id} .gm-bottom button {
            font-size: 1em;
            padding: 0.3em 1em;
            margin: 0 0.8em;
            cursor: pointer;
            background-color: var(--${gm.id}-background-color);
            border: 1px solid var(--${gm.id}-border-color);
            border-radius: 2px;
          }
          #${gm.id} .gm-bottom button:hover {
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-bottom button[disabled] {
            cursor: not-allowed;
            border-color: var(--${gm.id}-disabled-color);
            background-color: var(--${gm.id}-background-color);
          }

          #${gm.id} .gm-info {
            font-size: 0.8em;
            color: var(--${gm.id}-hint-text-color);
            text-decoration: underline;
            padding: 0 0.2em;
            cursor: pointer;
          }
          #${gm.id} .gm-info:visited {
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-info:hover {
            color: var(--${gm.id}-important-color);
          }
          #${gm.id} [disabled] .gm-info {
            color: var(--${gm.id}-disabled-color);
            cursor: not-allowed;
          }
  
          #${gm.id} #gm-reset {
            position: absolute;
            right: 0;
            bottom: 0;
            margin: 1em 1.6em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }
  
          #${gm.id} #gm-changelog {
            position: absolute;
            right: 0;
            bottom: 1.8em;
            margin: 1em 1.6em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }
          #${gm.id} [setting-type=updated] #gm-changelog {
            font-weight: bold;
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [setting-type=updated] #gm-changelog:hover {
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [setting-type=updated] .gm-updated,
          #${gm.id} [setting-type=updated] .gm-updated input,
          #${gm.id} [setting-type=updated] .gm-updated select {
            background-color: var(--${gm.id}-update-hightlight-color);
          }
          #${gm.id} [setting-type=updated] .gm-updated option {
            background-color: var(--${gm.id}-background-color);
          }
          #${gm.id} [setting-type=updated] tr:hover .gm-updated,
          #${gm.id} [setting-type=updated] tr:hover .gm-updated .gm-lineitem {
            color: var(--${gm.id}-update-hightlight-hover-color);
            font-weight: bold;
          }
  
          #${gm.id} #gm-reset:hover,
          #${gm.id} #gm-changelog:hover {
            color: var(--${gm.id}-hint-text-hightlight-color);
            text-decoration: underline;
          }
  
          #${gm.id} .gm-title {
            font-size: 1.6em;
            margin: 1.6em 0.8em 0.8em 0.8em;
            text-align: center;
          }
  
          #${gm.id} .gm-subtitle {
            font-size: 0.4em;
            margin-top: 0.4em;
          }
  
          #${gm.id} .gm-shadow {
            background-color: var(--${gm.id}-shadow-color);
            position: fixed;
            top: 0%;
            left: 0%;
            z-index: 15000;
            width: 100%;
            height: 100%;
          }
          #${gm.id} .gm-shadow[disabled] {
            cursor: auto;
          }
  
          #${gm.id} label {
            cursor: pointer;
          }
  
          #${gm.id} input,
          #${gm.id} select,
          #${gm.id} button {
            font-size: 100%;
            appearance: auto;
            outline: none;
            border: 1px solid var(--${gm.id}-border-color);
            border-radius: 0;
            color: var(--${gm.id}-text-color);
            background-color: var(--${gm.id}-background-color);
          }
  
          #${gm.id} a {
          color: var(--${gm.id}-hightlight-color)
          }
          #${gm.id} a:visited {
          color: var(--${gm.id}-link-visited-color)
          }
  
          #${gm.id} [disabled],
          #${gm.id} [disabled] input,
          #${gm.id} [disabled] select {
            cursor: not-allowed;
            color: var(--${gm.id}-disabled-color);
          }
  
          #${gm.id}-video-btn {
            display: flex;
            align-items: center;
            cursor: pointer;
          }
          #${gm.id}-video-btn input[type=checkbox] {
            margin-right: 2px;
            cursor: pointer;
            appearance: auto;
          }

          #${gm.id} .gm-setting .gm-items::-webkit-scrollbar,
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar {
            width: 6px;
            height: 6px;
            background-color: var(--${gm.id}-scrollbar-background-color);
          }
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--${gm.id}-scrollbar-background-color);
          }
          #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-thumb,
          #${gm.id} .gm-history .gm-content:hover::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--${gm.id}-scrollbar-thumb-color);
          }
          #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-corner,
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar-corner {
            background-color: var(--${gm.id}-scrollbar-background-color);
          }

          #${gm.id} .gm-entrypopup .gm-search {
            font-size: 1.3em;
            line-height: 2.6em;
            padding-left: 0.9em;
          }
          #${gm.id} .gm-entrypopup .gm-search input[type=text] {
            border: none;
            width: 18em;
          }

          .gm-search input[type=text] {
            line-height: normal;
            outline: none;
            padding-right: 6px;
            color: var(--${gm.id}-text-color);
          }
          .gm-search input[type=text]::placeholder {
            font-size: 0.9em;
            color: var(--${gm.id}-light-hint-text-color);
          }
          .gm-search-clear {
            display: inline-block;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
            visibility: hidden;
          }
          .gm-search-hide {
            display: none !important;
          }

          .gm-watchlater-item-deleted-origin {
            display: none;
          }
          .gm-watchlater-item-deleted {
            filter: grayscale(1);
            border-radius: 5px;
          }
          .gm-watchlater-item-deleted .key,
          .gm-watchlater-item-deleted .btn-del {
            visibility: hidden;
          }
          .gm-watchlater-item-deleted .t,
          .gm-watchlater-item-deleted .t:hover {
            text-decoration: line-through;
          }
        `)
      } else {
        if (api.web.urlMatch(gm.regex.page_dynamicMenu)) {
          this.addMenuScrollbarStyle()
        }
      }
    }
  }

  /**
   * 推入队列，循环数组实现
   * @template T 数据类型
   */
  class PushQueue {
    /**
     * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
     * @param {number} [capacity=maxSize] 容量，即循环数组的长度，不能小于 maxSize
     */
    constructor(maxSize, capacity) {
      /** 起始元素位置（指向起始元素后方） */
      this.index = 0
      /** 队列长度 */
      this.size = 0
      /** 最大长度 */
      this.maxSize = maxSize
      if (!capacity || capacity < maxSize) {
        capacity = maxSize
      }
      /** 容量 */
      this.capacity = capacity
      /** 内部数据 */
      this.data = new Array(capacity)
    }

    /**
     * 设置推入队列的最大长度
     * @param {number} maxSize 队列的最大长度，不能大于 capacity
     */
    setMaxSize(maxSize) {
      if (maxSize > this.capacity) {
        maxSize = this.capacity
      } else if (maxSize < this.size) {
        this.size = maxSize
      }
      this.maxSize = maxSize
      this.gc()
    }

    /**
     * 重新设置推入队列的容量
     * @param {number} capacity 容量
     */
    setCapacity(capacity) {
      if (this.maxSize > capacity) {
        this.maxSize = capacity
        if (this.size > capacity) {
          this.size = capacity
        }
        // no need to gc() here
      }
      const data = this.toArray().reverse()
      this.index = data.length
      data.length = capacity
      this.data = data
    }

    /**
     * 队列是否为空
     */
    empty() {
      return this.size == 0
    }

    /**
     * 向队列中推入数据，若队列已达到最大长度，则舍弃末尾处数据
     * @param {T} value 推入队列的数据
     */
    push(value) {
      this.data[this.index] = value
      this.index += 1
      if (this.index >= this.capacity) {
        this.index = 0
      }
      if (this.size < this.maxSize) {
        this.size += 1
      }
      if (this.maxSize < this.capacity && this.size == this.maxSize) { // maxSize 等于 capacity 时资源刚好完美利用，不必回收资源
        let release = this.index - this.size - 1
        if (release < 0) {
          release += this.capacity
        }
        this.data[release] = null
      }
    }

    /**
     * 将队列末位处的数据弹出
     * @returns {T} 弹出的数据
     */
    pop() {
      if (this.size > 0) {
        let index = this.index - this.size
        if (index < 0) {
          index += this.capacity
        }
        this.size -= 1
        const result = this.data[index]
        this.data[index] = null
        return result
      }
    }

    /**
     * 获取第 `n` 个元素（范围 `[0, size - 1]`）
     * @param {number} n 元素位置
     * @returns {T} 第 `n` 个元素
     */
    get(n) {
      if (this.size > 0 && n >= 0) {
        let index = this.index - n - 1
        if (index < 0) {
          index += this.capacity
        }
        return this.data[index]
      }
    }

    /**
     * 设置第 `n` 个元素的值为 `value`（范围 `[0, size - 1]`，且第 `n` 个元素必须已存在）
     * @param {number} n 元素位置
     * @param {T} value 要设置的值
     * @returns {boolean} 是否设置成功
     */
    set(n, value) {
      if (n <= this.size - 1 && n >= 0) {
        let index = this.index - n - 1
        if (index < 0) {
          index += this.capacity
        }
        this.data[index] = value
        return true
      } else {
        return false
      }
    }

    /**
     * 使用数组初始化推入队列
     * @param {Array<T>} array 初始化数组
     */
    fromArray(array) {
      if (this.maxSize < array.length) {
        this.data = array.slice(0, this.maxSize).reverse()
      } else {
        this.data = array.reverse()
      }
      this.index = this.data.length
      if (this.index >= this.capacity) {
        this.index = 0
      }
      this.size = this.data.length
      this.data.length = this.capacity
    }

    /**
     * 将推入队列以数组的形式返回
     * @param {number} [maxLength=size] 读取的最大长度
     * @param {number} [offset=0] 起始点
     * @returns {Array<T>} 队列数据的数组形式
     */
    toArray(maxLength = this.size, offset = 0) {
      if (offset < 0) {
        offset = 0
      }
      if (offset + maxLength > this.size) {
        maxLength = this.size - offset
      }
      const ar = []
      let start = this.index - offset
      if (start < 0) {
        start += this.capacity
      }
      let end = start - maxLength
      for (let i = start - 1; i >= end && i >= 0; i--) {
        ar.push(this.data[i])
      }
      if (end < 0) {
        end += this.capacity
        for (let i = this.capacity - 1; i >= end; i--) {
          ar.push(this.data[i])
        }
      }
      return ar
    }

    /**
     * 清理内部无效数据，释放内存
     */
    gc() {
      if (this.size > 0) {
        const start = this.index - 1
        let end = this.index - this.size
        if (end < 0) {
          end += this.capacity
        }
        if (start >= end) {
          for (let i = 0; i < end; i++) {
            this.data[i] = null
          }
          for (let i = start + 1; i < this.capacity; i++) {
            this.data[i] = null
          }
        } else if (start < end) {
          for (let i = start + 1; i < end; i++) {
            this.data[i] = null
          }
        }
      } else {
        this.data = new Array(this.capacity)
      }
    }
  }

  (function() {
    if (GM_info.scriptHandler != 'Tampermonkey') {
      api.dom.initUrlchangeEvent()
    }
    script = new Script()
    webpage = new Webpage()
    if (!webpage.method.isLogin()) {
      api.logger.info('终止执行：脚本只能工作在B站登录状态下。')
      return
    }

    script.initAtDocumentStart()
    if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      const disableRedirect = gm.searchParams.get(`${gm.id}_disable_redirect`) == 'true'
      if (gm.config.redirect && !disableRedirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
        webpage.redirect()
        return // 必须 return，否则后面的内容还会执行使得加载速度超级慢
      }
    }

    webpage.method.cleanSearchParams()
    webpage.addStyle()
    if (gm.config.mainRunAt == Enums.mainRunAt.DOMContentLoaded) {
      document.addEventListener('DOMContentLoaded', main)
    } else {
      window.addEventListener('load', main)
    }

    function main() {
      script.init()
      if (self == top) {
        script.addScriptMenu()

        if (gm.config.headerButton) {
          webpage.addHeaderButton()
        }
        if (gm.config.removeHistory) {
          webpage.processWatchlaterListDataSaving()
        }
        if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
          webpage.fillWatchlaterStatus()
        }
        if (gm.config.hideWatchlaterInCollect) {
          webpage.hideWatchlaterInCollect()
        }

        if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
          webpage.adjustWatchlaterListUI()
          webpage.processWatchlaterList()
        } else if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
          if (gm.config.videoButton) {
            webpage.addVideoButton()
          }
        }

        webpage.processSearchParams()
      } else {
        if (api.web.urlMatch(gm.regex.page_dynamicMenu)) {
          if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
            webpage.fillWatchlaterStatus()
          }
        }
      }
    }
  })()
})()
