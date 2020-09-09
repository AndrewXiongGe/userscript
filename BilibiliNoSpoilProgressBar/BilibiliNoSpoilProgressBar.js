// ==UserScript==
// @name            B站防剧透进度条
// @version         0.1.0.20200909
// @namespace       laster2800
// @author          Laster2800
// @description     看比赛、看番总是被进度条剧透？装上这个脚本再也不用担心这些问题了
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/[TODO]
// @supportURL      https://greasyfork.org/zh-CN/scripts/[TODO]/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://www.bilibili.com/bangumi/play/*
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=846211
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @connect         api.bilibili.com
// ==/UserScript==

(function() {
  'use strict'

  /**
   * 脚本内用到的枚举定义
   */
  const Enums = {}

  /**
   * 全局对象
   * @typedef GMObject
   * @property {string} id 脚本标识
   * @property {number} configVersion 配置版本，为最后一次执行初始化设置或功能性更新设置时脚本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号，只要涉及到配置的修改都要更新；若同一天修改多次，可以追加小数来区分
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_configMap} configMap 用户配置属性
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {GMObject_const} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   * @property {GMObject_error} error 错误信息
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} bangumiEnabled 番剧自动启用功能
   * @property {boolean} simpleScriptControl 是否简化进度条上方的脚本控制
   * @property {boolean} disableCurrentPoint 隐藏当前播放时间
   * @property {boolean} disableDuration 隐藏视频时长
   * @property {boolean} disablePbp 隐藏【热度】曲线
   * @property {boolean} disablePreview 隐藏进度条预览
   * @property {number} offsetLeft 进度条偏移极左值
   * @property {number} offsetRight 进度条偏移极右值
   * @property {number} reservedLeft 进度条左侧预留区
   * @property {number} reservedRight 进度条右侧预留区
   * @property {boolean} openSettingAfterConfigUpdate 功能性更新后打开设置页面
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @typedef {{[config: string]: GMObject_configMap_item}} GMObject_configMap
   */
  /**
   * @typedef GMObject_configMap_item
   * @property {'checked' | 'value'} attr 对应 `DOM` 节点上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @callback uploaderList 不传入/传入参数时获取/修改防剧透 UP 主名单
   * @param {string} [updateData] 更新数据
   * @returns {string} 防剧透 UP 主名单
   */
  /**
   * @callback uploaderListSet 通过懒加载方式获取格式化的防剧透 UP 主名单
   * @param {boolean} [reload] 是否重新加载数据
   * @returns {Set<String>} 防剧透 UP 主名单
   */
  /**
   * @typedef GMObject_data
   * @property {uploaderList} uploaderList 防剧透 UP 主名单
   * @property {uploaderListSet} uploaderListSet 防剧透 UP 主名单集合
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid' | 'bvid'} type `id` 类型
   * @returns 查询视频信息的 URL
   */
  /**
   * @typedef GMObject_url
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} gm_readme 说明文档
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看模式播放页
   * @property {RegExp} page_bangumi 匹配番剧播放页
   */
  /**
   * @typedef GMObject_const
   * @property {number} defaultOffsetLeft 结束点进度条滑块最小位置的默认值
   * @property {number} defaultOffsetRight 结束点进度条滑块最大位置的默认值
   * @property {number} defaultReservedLeft 进度条左侧预留区默认值
   * @property {number} defaultReservedRight 进度条右侧预留区默认值
   * @property {number} fadeTime UI 渐变时间（单位：ms）
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} uploaderList 防剧透 UP 主名单
   */
  /**
   * @typedef GMObject_menu_item
   * @property {boolean} state 打开状态
   * @property {HTMLElement} el 菜单元素
   * @property {() => void} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   */
  /**
   * @typedef GMObject_error
   * @property {string} DOM_PARSE 进度条解析错误
   * @property {string} NETWORK 网络错误
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: 'gmBeta', // TODO
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20200909,
    config: {
      bangumiEnabled: false,
      simpleScriptControl: false,
      disableCurrentPoint: false,
      disableDuration: true,
      disablePbp: true,
      disablePreview: false,
      offsetLeft: null,
      offsetRight: null,
      reservedLeft: null,
      reservedRight: null,
      openSettingAfterConfigUpdate: true,
      reloadAfterSetting: true,
    },
    configMap: {
      bangumiEnabled: { attr: 'checked', needNotReload: true },
      simpleScriptControl: { attr: 'checked' },
      disableCurrentPoint: { attr: 'checked' },
      disableDuration: { attr: 'checked' },
      disablePbp: { attr: 'checked' },
      disablePreview: { attr: 'checked' },
      offsetLeft: { attr: 'value', manual: true, needNotReload: true },
      offsetRight: { attr: 'value', manual: true, needNotReload: true },
      reservedLeft: { attr: 'value', manual: true, needNotReload: true },
      reservedRight: { attr: 'value', manual: true, needNotReload: true },
      openSettingAfterConfigUpdate: { attr: 'checked' },
      reloadAfterSetting: { attr: 'checked', needNotReload: true },
    },
    data: {
      uploaderList: null,
      uploaderListSet: null,
    },
    url: {
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      gm_readme: 'https://gitee.com/liangjiancang/userscript/blob/master/BilibiliNoSpoilProgressBar/README.md',
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/BilibiliNoSpoilProgressBar/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=\/|$)/,
      page_videoWatchlaterMode: /bilibili.com\/medialist\/play\/watchlater(?=\/|$)/,
      page_bangumi: /bilibili.com\/bangumi\/play(?=\/|$)/,
    },
    const: {
      defaultOffsetLeft: 30,
      defaultOffsetRight: 30,
      defaultReservedLeft: 10,
      defaultReservedRight: 10,
      fadeTime: 400,
    },
    menu: {
      setting: { state: false, el: null },
      uploaderList: { state: false, el: null },
    },
    el: {
      gmRoot: null,
      setting: null,
    },
    error: {
      DOM_PARSE: `DOM解析错误。大部分情况下是由于网络加载速度不足造成的，不影响脚本工作；否则就是B站网页改版，请联系脚本作者进行修改：${GM_info.script.supportURL}`,
      NETWORK: `网络连接错误，出现这个问题有可能是因为网络加载速度不足或者B站后台API被改动。也不排除是脚本内部数据出错造成的，初始化脚本或清空稍后再看数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`,
    }
  }

  /* global API */
  const api = new API({
    id: gm.id,
    label: GM_info.script.name,
    waitTimeout: 8000, // 相关元素加载较慢，等待时间可以稍长
    fadeTime: gm.const.fadeTime,
  })

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
         *
         * @param {string} gmKey 键名
         * @param {*} defaultValue 默认值
         * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
         * @returns {*} 通过校验时是配置值，不能通过校验时是默认值
         */
        gmValidate(gmKey, defaultValue, writeback = true) {
          const value = GM_getValue(gmKey)
          if (Enums && gmKey in Enums) {
            if (Enums[gmKey][value]) {
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
     * 初始化
     */
    init() {
      this.initGMObject()
      this.updateVersion()
      this.readConfig()
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
      gm.config = {
        ...gm.config,
        offsetLeft: gm.const.defaultOffsetLeft,
        offsetRight: gm.const.defaultOffsetRight,
        reservedLeft: gm.const.defaultReservedLeft,
        reservedRight: gm.const.defaultReservedRight,
      }

      gm.data = {
        ...gm.data,
        uploaderList: updateData => {
          const _ = gm.data._
          if (updateData) {
            GM_setValue('uploaderList', updateData)
            _.uploaderListSet = null
            return updateData
          } else {
            let uploaderList = GM_getValue('uploaderList')
            if (typeof uploaderList != 'string') {
              uploaderList = ''
              GM_setValue('uploaderList', uploaderList)
            }
            return uploaderList
          }
        },
        uploaderListSet: reload => {
          const _ = gm.data._
          if (!_.uploaderListSet || reload) {
            const set = new Set()
            const content = gm.data.uploaderList()
            if (content.startsWith('*')) {
              set.add('*')
            } else {
              const rows = content.split('\n')
              for (const row of rows) {
                const m = row.match(/^\d+/)
                if (m && m.length > 0) {
                  set.add(m[0])
                }
              }
            }
            _.uploaderListSet = set
          }
          return _.uploaderListSet
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
      // 该项与更新相关，在此处处理
      gm.config.openSettingAfterConfigUpdate = _self.method.gmValidate('openSettingAfterConfigUpdate', gm.config.openSettingAfterConfigUpdate)
      if (gm.configVersion > 0) {
        if (gm.configVersion < gm.configUpdate) {
          if (gm.config.openSettingAfterConfigUpdate) {
            _self.openUserSetting(2)
          }

          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.cofigUpdate，必须手写更新后的配置版本号！
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
        const cfgManual = { openSettingAfterConfigUpdate: true } // 手动处理的配置
        const cfgNoWriteback = {} // 不进行回写的配置
        for (const name in gm.config) {
          if (!cfgManual[name]) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name], !cfgNoWriteback[name])
          }
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        const cfgManual = {}
        for (const name in gm.config) {
          if (!cfgManual[name]) {
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
      // 防剧透 UP 主名单
      GM_registerMenuCommand('防剧透UP主名单', () => _self.openUploaderList())
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
         * 设置页面初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting'
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
                  <tr class="gm-item">
                    <td><div>说明</div></td>
                    <td>
                      <div>
                        <span>防剧透机制说明</span>
                        <a class="gm-hint-option" title="查看脚本防剧透机制的实现原理。" href="${gm.url.gm_readme}" target="_blank">点击查看</a>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="加入防剧透名单UP主的视频，会在打开视自动开启防剧透进度条。">
                    <td><div>自动化</div></td>
                    <td>
                      <span>防剧透UP主名单</span>
                      <span id="gm-uploaderList" class="gm-hint-option">点击编辑</span>
                    </td>
                  </tr>

                  <tr class="gm-item" title="番剧是否自动打开防剧透进度条？">
                    <td><div>自动化</div></td>
                    <td>
                      <label>
                        <span>番剧自动启用防剧透进度条</span>
                        <input id="gm-bangumiEnabled" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="是否简化进度条上方的脚本控制？">
                    <td><div>用户接口</div></td>
                    <td>
                      <label>
                        <span>简化进度条上方的脚本控制</span>
                        <input id="gm-simpleScriptControl" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这些功能可能会造成剧透，根据需要在防剧透进度条中进行隐藏。">
                    <td rowspan="5"><div>用户接口</div></td>
                    <td>
                      <div>
                        <span>启用功能时</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏当前播放时间？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏当前播放时间</span>
                        <input id="gm-disableCurrentPoint" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏视频时长？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏视频时长</span>
                        <input id="gm-disableDuration" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏【热度】曲线？该功能可能会造成剧透。（pakku 扩展的弹幕频率图也会被禁用）">
                    <td>
                      <label>
                        <span>隐藏【热度】曲线</span>
                        <input id="gm-disablePbp" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏进度条预览？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏进度条预览</span>
                        <input id="gm-disablePreview" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="防剧透参数设置，请务必在理解参数作用的前提下修改！">
                    <td rowspan="5"><div>高级设置</div></td>
                    <td>
                      <div>
                        <span>防剧透参数</span>
                        <span id="gm-resetParam" class="gm-hint-option" title="重置防剧透参数。">重置</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条偏移极左值设置。">
                    <td>
                      <div>
                        <span>进度条偏移极左值</span>
                        <span id="gm-offsetLeftInformation" class="gm-information" title="">💬</span>
                        <input id="gm-offsetLeft" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条偏移极右值设置。">
                    <td>
                      <div>
                        <span>进度条偏移极右值</span>
                        <span id="gm-offsetRightInformation" class="gm-information" title="">💬</span>
                        <input id="gm-offsetRight" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条左侧预留区设置。">
                    <td>
                      <div>
                        <span>进度条左侧预留区</span>
                        <span id="gm-reservedLeftInformation" class="gm-information" title="">💬</span>
                        <input id="gm-reservedLeft" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条右侧预留区设置。">
                    <td>
                      <div>
                        <span>进度条右侧预留区</span>
                        <span id="gm-reservedRightInformation" class="gm-information" title="">💬</span>
                        <input id="gm-reservedRight" type="text">
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="功能性更新后，是否打开用户设置？">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>功能性更新后打开用户设置</span>
                        <input id="gm-openSettingAfterConfigUpdate" type="checkbox">
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
              <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。该操作不会清除已保存的稍后再看数据，因此不会导致移除记录丢失。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a id="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in gm.config) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('#gm-setting-page')
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
              for (const name in gm.configMap) {
                const configVersion = gm.configMap[name].configVersion
                if (configVersion && configVersion > gm.configVersion) {
                  let node = el[name]
                  while (node.nodeName != 'TD') {
                    node = node.parentNode
                    if (!node) {
                      api.logger.error(gm.error.DOM_PARSE)
                      break
                    }
                  }
                  if (node && node.firstElementChild) {
                    api.dom.addClass(node.firstElementChild, 'gm-updated')
                  }
                }
              }
              break
          }
          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.resetParam = gm.el.setting.querySelector('#gm-resetParam')
          el.uploaderList = gm.el.setting.querySelector('#gm-uploaderList')

          // 提示信息
          el.offsetLeftInformation = gm.el.setting.querySelector('#gm-offsetLeftInformation')
          api.message.advanced(el.offsetLeftInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向左偏移的距离（百分比），该选项用于解决进度条前向剧透问题。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.offsetRightInformation = gm.el.setting.querySelector('#gm-offsetRightInformation')
          api.message.advanced(el.offsetRightInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向左偏移的距离（百分比），该选项用于解决进度条后向剧透问题。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.reservedLeftInformation = gm.el.setting.querySelector('#gm-reservedLeftInformation')
          api.message.advanced(el.reservedLeftInformation, `
            <div style="line-height:1.6em">
              进度条左侧预留区间大小（百分比）。若进度条向左偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最右侧（特别地，若播放进度比偏移量小则不偏移）。该选项是为了保证在任何情况下都能通过点击滑块左侧区域向前调整进度。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.reservedRightInformation = gm.el.setting.querySelector('#gm-reservedRightInformation')
          api.message.advanced(el.reservedRightInformation, `
            <div style="line-height:1.6em">
              进度条右侧预留区间大小（百分比）。若进度条向右偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最左侧。该选项是为了保证在任何情况下都能通过点击滑块右侧区域向后调整进度。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        const processConfigItem = () => {
          el.offsetLeft.oninput = el.offsetRight.oninput = el.reservedLeft.oninput = el.reservedRight.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > 100) {
                value = 100
              }
              this.value = value
            }
          }
          el.offsetLeft.onblur = function() {
            if (this.value === '') {
              this.value = gm.const.defaultOffsetLeft
            }
          }
          el.offsetRight.onblur = function() {
            if (this.value === '') {
              this.value = gm.const.defaultOffsetRight
            }
          }
          el.reservedLeft.onblur = function() {
            if (this.value === '') {
              this.value = gm.const.defaultReservedLeft
            }
          }
          el.reservedRight.onblur = function() {
            if (this.value === '') {
              this.value = gm.const.defaultReservedRight
            }
          }
        }

        /**
         * 处理与设置页面相关的数据和元素
         */
        const processSettingItem = () => {
          const _self = this
          gm.menu.setting.openHandler = onOpen
          el.save.onclick = onSave
          el.cancel.onclick = () => _self.closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          }
          el.reset.onclick = () => _self.resetScript()
          el.resetParam.onclick = () => {
            el.offsetLeft.value = gm.const.defaultOffsetLeft
            el.offsetRight.value = gm.const.defaultOffsetRight
            el.reservedLeft.value = gm.const.defaultReservedLeft
            el.reservedRight.value = gm.const.defaultReservedRight
          }
          el.uploaderList.onclick = () => {
            _self.openUploaderList()
          }
          if (type > 0) {
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', '')
          }
        }

        let needReload = false
        /**
         * 设置保存时执行
         */
        const onSave = () => {
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
          let offsetLeft = parseInt(el.offsetLeft.value)
          let offsetRight = parseInt(el.offsetRight.value)
          let reservedLeft = parseInt(el.reservedLeft.value)
          let reservedRight = parseInt(el.reservedRight.value)
          if (isNaN(offsetLeft)) {
            offsetLeft = gm.const.defaultOffsetLeft
          }
          if (isNaN(offsetRight)) {
            offsetRight = gm.const.defaultOffsetRight
          }
          if (isNaN(reservedLeft)) {
            reservedLeft = gm.const.defaultReservedLeft
          }
          if (isNaN(reservedRight)) {
            reservedRight = gm.const.defaultReservedRight
          }
          if (offsetLeft != gm.config.offsetLeft) {
            gm.config.offsetLeft = offsetLeft
            GM_setValue('offsetLeft', gm.config.offsetLeft)
          }
          if (offsetRight != gm.config.offsetRight) {
            gm.config.offsetRight = offsetRight
            GM_setValue('offsetRight', gm.config.offsetRight)
          }
          if (reservedLeft != gm.config.reservedLeft) {
            gm.config.reservedLeft = reservedLeft
            GM_setValue('reservedLeft', gm.config.reservedLeft)
          }
          if (reservedRight != gm.config.reservedRight) {
            gm.config.reservedRight = reservedRight
            GM_setValue('reservedRight', gm.config.reservedRight)
          }

          _self.closeMenuItem('setting')
          if (type > 0) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭特殊状态
            setTimeout(() => {
              el.settingPage.removeAttribute('setting-type')
              el.maintitle.innerText = GM_info.script.name
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
            el[name].init && el[name].init()
          }

          el.settingPage.parentNode.style.display = 'block'
          setTimeout(() => {
            api.dom.setAbsoluteCenter(el.settingPage)
          }, 10)
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        const saveConfig = (name, attr) => {
          const elValue = el[name][attr]
          if (gm.config[name] != elValue) {
            gm.config[name] = elValue
            GM_setValue(name, gm.config[name])
            return true
          }
          return false
        }
      }
    }

    /**
     * 打开防剧透 UP 主名单
     */
    openUploaderList() {
      const _self = this
      const el = {}
      if (gm.el.uploaderList) {
        _self.openMenuItem('uploaderList', null, true)
      } else {
        setTimeout(() => {
          initEditor()
          processItem()
          _self.openMenuItem('uploaderList', null, true)
        })

        /**
         * 初始化防剧透 UP 主名单编辑器
         */
        const initEditor = () => {
          gm.el.uploaderList = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.uploaderList.el = gm.el.uploaderList
          gm.el.uploaderList.className = 'gm-uploaderList'
          gm.el.uploaderList.innerHTML = `
            <div class="gm-uploaderList-page">
              <div class="gm-title">防剧透UP主名单</div>
              <div class="gm-comment">
                <div>当打开名单内UP主的视频时，会自动启用防剧透进度条。在下方文本框内填入UP主的UID，其中UID可在UP主的个人空间中找到。每行必须以UID开头，UID后可以用空格隔开进行注释。<b>第一行以&nbsp;&nbsp;*&nbsp;&nbsp;开头</b>时，匹配所有UP主。<span id="gm-uploader-list-example" class="gm-hint-option">点击填充示例。</span></div>
              </div>
              <div class="gm-list-editor">
                <textarea id="gm-uploaderList"></textarea>
              </div>
              <div class="gm-bottom">
                <button id="gm-save">保存</button>
                <button id="gm-cancel">取消</button>
              </div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.uploaderListPage = gm.el.uploaderList.querySelector('.gm-uploaderList-page')
          el.uploaderList = gm.el.uploaderList.querySelector('#gm-uploaderList')
          el.uploaderListExample = gm.el.uploaderList.querySelector('#gm-uploader-list-example')
          el.save = gm.el.uploaderList.querySelector('#gm-save')
          el.cancel = gm.el.uploaderList.querySelector('#gm-cancel')
          el.shadow = gm.el.uploaderList.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          gm.menu.uploaderList.openHandler = onOpen
          el.uploaderListExample.onclick = () => {
            el.uploaderList.value = '# 非UID起始的行不会影响名单读取\n204335848 # 皇室战争电竞频道\n50329118 # 哔哩哔哩英雄联盟赛事'
          }
          el.save.onclick = onSave
          el.cancel.onclick = el.shadow.onclick = () => _self.closeMenuItem('uploaderList')
        }

        /**
         * 防剧透 UP 主名单保存时执行
         */
        const onSave = () => {
          gm.data.uploaderList(el.uploaderList.value)
          _self.closeMenuItem('uploaderList')
        }

        /**
         * 防剧透 UP 主名单打开时执行
         */
        const onOpen = () => {
          el.uploaderList.value = gm.data.uploaderList()
          api.dom.setAbsoluteCenter(el.uploaderListPage)
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = confirm(`【${GM_info.script.name}】\n\n是否要初始化脚本？`)
      if (result) {
        const keyNoReset = {}
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
     * 对“打开菜单项”这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 打开菜单项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他菜单项
     */
    openMenuItem(name, callback, keepOthers) {
      const _self = this
      if (!gm.menu[name].state) {
        for (const key in gm.menu) {
          /** @type {GMObject_menu_item} */
          const menu = gm.menu[key]
          if (key == name) {
            menu.state = true
            menu.openHandler && menu.openHandler.call(menu)
            api.dom.fade(true, menu.el, callback)
          } else if (!keepOthers) {
            if (menu.state) {
              _self.closeMenuItem(key)
            }
          }
        }
      }
    }

    /**
     * 对“关闭菜单项”这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 关闭菜单项后的回调函数
     */
    closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      if (menu.state) {
        menu.state = false
        api.dom.fade(false, menu.el, () => {
          menu.closeHandler && menu.closeHandler.call(menu)
          callback && callback.call(menu)
        })
      }
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    constructor() {
      this.script = new Script()

      /**
       * 播放控制
       * @type {HTMLElement}
       */
      this.control = {}
      /**
       * 进度条
       * @typedef ProgressBar
       * @property {HTMLElement} root 进度条根元素
       * @property {HTMLElement} bar 进度条主体
       * @property {HTMLElement} thumb 进度条滑块
       * @property {HTMLElement} track 进度条滑槽
       * @property {HTMLElement} buffer 进度条缓冲显示
       * @property {HTMLElement} played 进度条已播放显示
       * @property {HTMLElement} preview 进度条预览
       */
      /**
       * 进度条
       * @type {ProgressBar}
       */
      this.progress = {}
      /**
       * 视频最底下的影子进度条
       * @type {HTMLElement}
       */
      this.shadowProgress = null
      /**
       * 用于模仿被隐藏的进度条滑槽
       * @type {HTMLElement}
       */
      this.fakeTrack = null
      /**
       * 用于模仿被隐藏的进度条滑槽中的已播放显示
       * @type {HTMLElement}
       */
      this.fakePlayed = null


      /**
       * 脚本控制条
       * @type {HTMLElement}
       */
      this.scriptControl = null

      /**
       * 是否开启防剧透功能
       * @type {boolean}
       */
      this.enabled = false
      /**
       * 当前 UP 主是否在防剧透名单中
       */
      this.uploaderEnabled = false

      /**
       * 通用方法
       */
      this.method = {
        /**
         * 获取 `aid`
         * @async
         * @returns {Promise<string>} `aid`
         */
        async getAid() {
          let aid
          try {
            if (unsafeWindow.aid) {
              aid = unsafeWindow.aid
            } else {
              aid = await api.wait.waitForConditionPassed({
                condition: () => {
                  const player = unsafeWindow.player
                  const message = player && player.getVideoMessage && player.getVideoMessage()
                  return message && message.aid
                },
              })
            }
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
          return String(aid)
        },

        /**
         * 获取视频信息
         * @async
         * @param {string} id `aid` 或 `bvid`
         * @param {'aid' | 'bvid'} [type='bvid'] `id` 类型
         * @returns {Promise<JSON>} 视频信息
         */
        async getVideoInfo(id, type = 'bvid') {
          try {
            const resp = await api.web.request({
              method: 'GET',
              url: gm.url.api_videoInfo(id, type),
            })
            return JSON.parse(resp.responseText).data
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
            api.logger.error(e)
          }
        },
      }
    }

    /**
     * 初始化页面内容
     * @async
     * @throws DOM 解析错误时抛出
     */
    async initWebpage() {
      const _self = this
      _self.uploaderEnabled = false
      _self.enabled = await _self.detectEnabled()

      _self.control = await api.wait.waitForElementLoaded('.bilibili-player-video-control')
      _self.progress.root = await api.wait.waitForElementLoaded('.bilibili-player-video-progress', _self.control)
      _self.progress.bar = await api.wait.waitForElementLoaded('.bilibili-player-video-progress-slider', _self.progress.root)
      _self.progress.thumb = await api.wait.waitForElementLoaded('.bui-thumb', _self.progress.bar)
      _self.progress.track = await api.wait.waitForElementLoaded('.bui-bar-wrap', _self.progress.bar)
      _self.progress.buffer = await api.wait.waitForElementLoaded('.bui-bar-buffer', _self.progress.track)
      _self.progress.played = await api.wait.waitForElementLoaded('.bui-bar-normal', _self.progress.track)
      _self.progress.preview = await api.wait.waitForElementLoaded('.bilibili-player-video-progress-detail', _self.progress.root)
      _self.shadowProgress = await api.wait.waitForElementLoaded('.bilibili-player-video-progress-shadow', this.control)

      _self.fakeTrack = _self.progress.track.parentNode.insertBefore(_self.progress.track.cloneNode(true), _self.progress.track) // 必须在 thumb 前，否则 z 轴层次错误
      _self.fakeTrack.style.visibility = 'hidden'
      _self.fakeTrack.querySelector('.bui-bar-buffer').style.visibility = 'hidden'
      _self.fakePlayed = _self.fakeTrack.querySelector('.bui-bar-normal')

      _self.initScriptControl()

      await api.wait.waitForConditionPassed({
        condition: () => {
          const player = unsafeWindow.player
          return player.getCurrentTime && player.getDuration
        },
      })
    }

    /**
     * 判断当前页面时是否自动启用功能
     * @async
     * @returns {boolean} 当前页面时是否自动启用功能
     */
    async detectEnabled() {
      const _self = this
      if (api.web.urlMatch(gm.regex.page_videoNormalMode) || api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        try {
          const ulSet = gm.data.uploaderListSet()
          if (ulSet.has('*')) {
            return true
          }
          const aid = await _self.method.getAid()
          const videoInfo = await _self.method.getVideoInfo(aid, 'aid')
          const uid = String(videoInfo.owner.mid)
          if (ulSet.has(uid)) {
            _self.uploaderEnabled = true
            return true
          }
        } catch (e) {
          api.logger.error(gm.error.NETWORK)
          api.logger.error(e)
        }
      } else if (api.web.urlMatch(gm.regex.page_bangumi)) {
        if (gm.config.bangumiEnabled) {
          return true
        }
      }
      return false
    }

    /**
     * 防剧透功能处理流程
     */
    processNoSpoil() {
      const _self = this
      if (!_self.control._noSpoilHandler) {
        _self.control._noSpoilHandler = () => {
          let offset = 'offset'
          let playRate = 0
          if (_self.enabled) {
            if (!_self.progress._noSpoil) {
              _self.progress._fakeRandom = Math.random()
            }
            const player = unsafeWindow.player
            playRate = player.getCurrentTime() / player.getDuration()
            const min = 100 - gm.config.offsetLeft
            const max = 100 + gm.config.offsetRight
            const fakeEnd = _self.progress._fakeRandom * (max - min) + min
            offset = playRate * (fakeEnd - 100)
            if (offset > 0) {
              const reserved = 100 - gm.config.reservedRight
              if (playRate * 100 + offset > reserved) {
                offset = reserved - playRate * 100
              }
            } else {
              const reserved = gm.config.reservedLeft
              if (playRate * 100 + offset < reserved) {
                if (playRate * 100 < reserved) {
                  offset = 0
                } else {
                  offset = reserved - playRate * 100
                }
              }
            }
            _self.progress._noSpoil = true
          } else if (_self.progress._noSpoil) {
            offset = 0
          }
          if (typeof offset == 'number') {
            _self.progress.root.style.transform = `translateX(${offset}%)`
            _self.scriptControl.transform = `translateX(${-offset}%)`
            if (_self.enabled) {
              _self.progress.track.style.visibility = 'hidden'
              _self.shadowProgress.style.visibility = 'hidden'
              _self.fakeTrack.style.visibility = 'visible'
              _self.fakeTrack.style.transform = `translateX(${-offset}%)`
              _self.fakePlayed.style.transform = `scaleX(${playRate + offset / 100})`
            } else {
              _self.progress._noSpoil = false
              _self.progress.track.style.visibility = 'visible'
              _self.shadowProgress.style.visibility = 'visible'
              _self.fakeTrack.style.visibility = 'hidden'
            }
          }

          if (api.web.urlMatch(gm.regex.page_videoNormalMode) || api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
            if (_self.uploaderEnabled) {
              _self.scriptControl.uploaderEnabled.setAttribute('enabled', '')
            } else {
              _self.scriptControl.uploaderEnabled.removeAttribute('enabled')
            }
          }
          if (api.web.urlMatch(gm.regex.page_bangumi)) {
            if (gm.config.bangumiEnabled) {
              _self.scriptControl.bangumiEnabled.setAttribute('enabled', '')
            } else {
              _self.scriptControl.bangumiEnabled.removeAttribute('enabled')
            }
          }
        }
      }
      const syncHandler = function() {
        setTimeout(_self.control._noSpoilHandler, 10)
      }
      _self.control._noSpoilHandler()
      _self.control.addEventListener('mouseenter', _self.control._noSpoilHandler) // 拖拽 thumb 释放来调整进度也会触发 mouseenter 事件
      _self.progress.bar.addEventListener('click', syncHandler)

      if (_self.enabled) {
        _self.progress.preview.style.visibility = gm.config.disablePreview ? 'hidden' : 'visible'
      } else {
        _self.progress.preview.style.visibility = 'visible'
      }

      // 隐藏当前播放时间
      api.wait.waitForElementLoaded('.bilibili-player-video-time-now:not(.fake)').then(currentPoint => {
        if (_self.enabled && gm.config.disableCurrentPoint) {
          if (!currentPoint._fake) {
            currentPoint._fake = currentPoint.parentNode.insertBefore(currentPoint.cloneNode(true), currentPoint)
            currentPoint._fake.innerText = '???'
            api.dom.addClass(currentPoint._fake, 'fake')
          }
          currentPoint.style.display = 'none'
          currentPoint._fake.style.display = 'unset'
        } else {
          currentPoint.style.display = 'unset'
          if (currentPoint._fake) {
            currentPoint._fake.style.display = 'none'
          }
        }
      })
      // 隐藏视频时长
      api.wait.waitForElementLoaded('.bilibili-player-video-time-total').then(duration => {
        if (_self.enabled && gm.config.disableDuration) {
          duration._innerText = duration.innerText
          duration.innerText = '???'
        } else if (duration._innerText) {
          duration.innerText = duration._innerText
        }
      }).catch(e => {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      })
      // 隐藏高能进度条的【热度】曲线（可能存在）
      api.wait.waitForElementLoaded('#bilibili_pbp', _self.control).then(pbp => {
        const hide = _self.enabled && gm.config.disablePbp
        pbp.style.visibility = hide ? 'hidden' : ''
      }).catch(() => {})
      // 隐藏 pakku 扩展引入的弹幕密度显示（可能存在）
      api.wait.waitForElementLoaded('canvas.pakku-fluctlight', _self.control).then(pakku => {
        const hide = _self.enabled && gm.config.disablePbp
        pakku.style.visibility = hide ? 'hidden' : ''
      }).catch(() => {})
    }

    /**
     * 初始化防剧透功能
     * @async
     */
    async initNoSpoil() {
      try {
        const _self = this
        await _self.initWebpage()
        await _self.processNoSpoil()

        // 加载完页面后，有时候视频会莫名其妙地重新刷新，原因不明
        // 总之，先等一下看注入的内容还在，如果不再则重新初始化
        // 若没有发生刷新，则不必处理
        api.wait.executeAfterConditionPassed({
          condition: () => {
            const scriptControl = document.querySelector(`.${gm.id}-scriptControl`)
            return !scriptControl
          },
          callback: () => {
            _self.initNoSpoil()
          },
          interval: 250,
          timePadding: 1000,
        })
      } catch (e) {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      }
    }

    /**
     * 初始化页面切换处理
     * @async
     */
    async initLocationChangeProcess() {
      const _self = this
      let currentPathname = location.pathname
      let currentAid = await _self.method.getAid()
      api.dom.createLocationchangeEvent()
      window.addEventListener('locationchange', function() {
        api.wait.waitForConditionPassed({
          condition: async () => {
            if (location.pathname == currentPathname) {
              // 并非切换视频（如切分 P）
              return currentAid
            } else {
              const aid = await _self.method.getAid()
              if (aid != currentAid) { // aid 改变才能说明页面真正切换过去
                currentPathname = location.pathname
                return aid
              }
            }
          },
        }).then(aid => {
          currentAid = aid
          _self.initNoSpoil()
          if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
            _self.initSwitchingPartProcess()
          }
        }).catch(e => {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        })
      })
    }

    /**
     * 初始化稍后再看模式播放页切换分 P 的处理
     * @async
     */
    async initSwitchingPartProcess() {
      try {
        const _self = this
        let obActiveP, obList
        const list = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-list')
        try {
          const activeVideo = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-active', list)
          const pList = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-p-list', activeVideo)
          if (pList) {
            const activeP = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-p-item-active', pList)
            obActiveP = new MutationObserver(async (records, observer) => {
              for (const record of records) {
                if (record.attributeName == 'class') {
                  observer.disconnect()
                  obList && obList.disconnect()
                  const currentActive = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-active')
                  if (currentActive === activeVideo) {
                    _self.initNoSpoil()
                    _self.initSwitchingPartProcess()
                  }
                  break
                }
              }
            })
            obActiveP.observe(activeP, { attributes: true })
          }
        } catch (e) {
          // 只是因为 list 已经变化，导致在原 list 下找不到对应的元素而已，实际并无错误
        }

        // 如果 list 中发生修改，则前面的监听无效，应当重新处理
        obList = new MutationObserver((records, observer) => {
          observer.disconnect()
          obActiveP && obActiveP.disconnect()
          _self.initSwitchingPartProcess()
        })
        obList.observe(list, { childList: true })
      } catch (e) {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      }
    }

    /**
     * 初始化脚本控制条
     */
    initScriptControl() {
      const _self = this
      if (!_self.control._scriptControl) {
        _self.scriptControl = _self.progress.root.parentNode.appendChild(document.createElement('div'))
        _self.control._scriptControl = _self.scriptControl
        _self.scriptControl.className = `${gm.id}-scriptControl`
        _self.scriptControl.innerHTML = `
          <span id="${gm.id}-enabled">防剧透</span>
          <span id="${gm.id}-uploaderEnabled" style="display:none">将UP主加入防剧透名单</span>
          <span id="${gm.id}-bangumiEnabled" style="display:none">番剧自动启用防剧透</span>
          <span id="${gm.id}-setting" style="display:none">设置</span>
        `
      }

      _self.scriptControl.enabled = _self.scriptControl.querySelector(`#${gm.id}-enabled`)
      _self.scriptControl.uploaderEnabled = _self.scriptControl.querySelector(`#${gm.id}-uploaderEnabled`)
      _self.scriptControl.bangumiEnabled = _self.scriptControl.querySelector(`#${gm.id}-bangumiEnabled`)
      _self.scriptControl.setting = _self.scriptControl.querySelector(`#${gm.id}-setting`)

      _self.scriptControl.enabled.handler = function() {
        if (_self.enabled) {
          this.setAttribute('enabled', '')
        } else {
          this.removeAttribute('enabled')
        }
        _self.processNoSpoil()
      }
      _self.scriptControl.enabled.onclick = function() {
        _self.enabled = !_self.enabled
        this.handler()
      }
      if (this.enabled) {
        _self.scriptControl.enabled.handler()
      }

      if (!gm.config.simpleScriptControl) {
        if (api.web.urlMatch(gm.regex.page_videoNormalMode) || api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
          if (!gm.data.uploaderListSet().has('*')) { // * 匹配所有 UP 主不显示该按钮
            _self.scriptControl.uploaderEnabled.style.display = 'unset'
            _self.scriptControl.uploaderEnabled.onclick = async function() {
              try {
                const ulSet = gm.data.uploaderListSet() // 必须每次读取
                const aid = await _self.method.getAid()
                const videoInfo = await _self.method.getVideoInfo(aid, 'aid')
                const uid = String(videoInfo.owner.mid)
    
                _self.uploaderEnabled = !_self.uploaderEnabled
                if (_self.uploaderEnabled) {
                  this.setAttribute('enabled', '')
                  if (!ulSet.has(uid)) {
                    const ul = gm.data.uploaderList()
                    gm.data.uploaderList(`${ul}\n${uid}`)
                  }
                } else {
                  this.removeAttribute('enabled')
                  if (ulSet.has(uid)) {
                    let ul = gm.data.uploaderList()
                    ul = ul.replaceAll(new RegExp(`^${uid}(?=\\D|$).*\n?`, 'gm'), '')
                    gm.data.uploaderList(ul)
                  }
                }
              } catch (e) {
                api.logger.error(gm.error.NETWORK)
                api.logger.error(e)
              }
            }
          }
        }

        if (api.web.urlMatch(gm.regex.page_bangumi)) {
          _self.scriptControl.bangumiEnabled.style.display = 'unset'
          _self.scriptControl.bangumiEnabled.onclick = function() {
            gm.config.bangumiEnabled = !gm.config.bangumiEnabled
            if (gm.config.bangumiEnabled) {
              this.setAttribute('enabled', '')
            } else {
              this.removeAttribute('enabled')
            }
            GM_setValue('bangumiEnabled', gm.config.bangumiEnabled)
          }
        }

        _self.scriptControl.setting.style.display = 'unset'
        _self.scriptControl.setting.onclick = function() {
          _self.script.openUserSetting()
        }
      }
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      GM_addStyle(`
        :root {
          --control-item-selected-color: #00c7ff;
          --control-item-shadow-color: #00000050;
          --text-color: black;
          --text-bold-color: #3a3a3a;
          --light-text-color: white;
          --hint-text-color: gray;
          --hint-text-hightlight-color: #555555;
          --background-color: white;
          --background-hightlight-color: #ebebeb;
          --update-hightlight-color: #c2ffc2;
          --update-hightlight-hover-color: #a90000;
          --border-color: black;
          --shadow-color: #000000bf;
          --hightlight-color: #0075FF;
          --important-color: red;
          --warn-color: #e37100;
          --disabled-color: gray;
          --link-visited-color: #551a8b;
          --opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
        }

        .${gm.id}-scriptControl {
          position: absolute;
          left: 0;
          bottom: 0;
          color: var(--light-text-color);
          margin-bottom: 0.8em;
          font-size: 13px;
          z-index: 10000;
        }

        .${gm.id}-scriptControl > * {
          cursor: pointer;
          border: 1px solid;
          border-radius: 0.4em;
          padding: 0.1em 0.3em;
          margin: 0 0.1em;
          background-color: var(--control-item-shadow-color);
        }
        .${gm.id}-scriptControl > *[enabled] {
          color: var(--control-item-selected-color);
        }

        #${gm.id} {
          color: var(--text-color);
        }

        #${gm.id} .gm-setting {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 10000;
          user-select: none;
        }

        #${gm.id} .gm-setting #gm-setting-page {
          background-color: var(--background-color);
          border-radius: 10px;
          z-index: 65535;
          min-width: 42em;
          padding: 1em 1.4em;
          transition: top 100ms, left 100ms;
        }

        #${gm.id} .gm-setting #gm-maintitle * {
          cursor: pointer;
          color: var(--text-color);
        }
        #${gm.id} .gm-setting #gm-maintitle:hover * {
          color: var(--hightlight-color);
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
        }
        #${gm.id} .gm-setting td {
          position: relative;
        }
        #${gm.id} .gm-setting .gm-item td:first-child {
          vertical-align: top;
          padding-right: 0.6em;
          font-weight: bold;
          color: var(--text-bold-color);
        }
        #${gm.id} .gm-setting .gm-item:not(:first-child) td {
          padding-top: 0.5em;
        }
        #${gm.id} .gm-setting td > * {
          padding: 0.2em;
          border-radius: 0.2em;
        }

        #${gm.id} .gm-setting .gm-item:hover {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-subitem[disabled] {
          color: var(--disabled-color);
        }
        #${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting label {
          display: flex;
          align-items: center;
        }
        #${gm.id} .gm-setting input[type=checkbox] {
          margin-left: auto;
        }
        #${gm.id} .gm-setting input[type=text] {
          float: right;
          border-width: 0 0 1px 0;
          border-radius: 0;
          width: 2.4em;
          text-align: right;
          padding: 0 0.2em;
          margin: 0 -0.2em;
        }
        #${gm.id} .gm-setting select {
          border-width: 0 0 1px 0;
          cursor: pointer;
          margin: 0 -0.2em;
        }

        #${gm.id} .gm-setting .gm-information {
          margin: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-setting [disabled] .gm-information {
          cursor: not-allowed;
        }

        #${gm.id} .gm-setting .gm-warning {
          position: absolute;
          right: -1.1em;
          color: var(--warn-color);
          font-size: 1.4em;
          line-height: 1em;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          cursor: pointer;
        }

        #${gm.id} .gm-uploaderList {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 12000;
          user-select: none;
        }

        #${gm.id} .gm-uploaderList .gm-uploaderList-page {
          background-color: var(--background-color);
          border-radius: 10px;
          z-index: 65535;
          width: 60vw;
          height: 40em;
          min-width: 40em;
          transition: top 100ms, left 100ms;
        }

        #${gm.id} .gm-uploaderList .gm-comment {
          margin: 0 2em;
          color: var(--hint-text-color);
          text-indent: 2em;
        }

        #${gm.id} .gm-uploaderList .gm-list-editor {
          margin: 1em 2em 1em 2em;
        }

        #${gm.id} .gm-uploaderList .gm-list-editor textarea {
          font-size: 1.3em;
          width: calc(100% - 2em);
          height: 15.2em;
          padding: 1em;
          resize: none;
          outline: none;
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
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 2px;
        }
        #${gm.id} .gm-bottom button:hover {
          background-color: var(--background-hightlight-color);
        }
        #${gm.id} .gm-bottom button[disabled] {
          cursor: not-allowed;
          border-color: var(--disabled-color);
          background-color: var(--background-color);
        }

        #${gm.id} .gm-hint-option {
          font-size: 0.8em;
          color: var(--hint-text-color);
          text-decoration: underline;
          padding: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-hint-option:hover {
          color: var(--important-color);
        }
        #${gm.id} [disabled] .gm-hint-option {
          color: var(--disabled-color);
          cursor: not-allowed;
        }

        #${gm.id} #gm-reset {
          position: absolute;
          right: 0;
          bottom: 0;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }

        #${gm.id} #gm-changelog {
          position: absolute;
          right: 0;
          bottom: 1.8em;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }
        #${gm.id} [setting-type=updated] #gm-changelog {
          font-weight: bold;
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] #gm-changelog:hover {
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated,
        #${gm.id} [setting-type=updated] .gm-updated input,
        #${gm.id} [setting-type=updated] .gm-updated select {
          background-color: var(--update-hightlight-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated option {
          background-color: var(--background-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated:hover {
          color: var(--update-hightlight-hover-color);
        }

        #${gm.id} #gm-reset:hover,
        #${gm.id} #gm-changelog:hover {
          color: var(--hint-text-hightlight-color);
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
          background-color: var(--shadow-color);
          position: fixed;
          top: 0%;
          left: 0%;
          z-index: 10000;
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
          color: var(--text-color);
          outline: none;
          appearance: auto; /* 番剧播放页该项被覆盖 */
        }

        #${gm.id} a {
        color: var(--hightlight-color)
        }
        #${gm.id} a:visited {
        color: var(--link-visited-color)
        }

        #${gm.id} [disabled],
        #${gm.id} [disabled] input,
        #${gm.id} [disabled] select {
          cursor: not-allowed;
          color: var(--disabled-color);
        }

        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          background-color: var(--scrollbar-background-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-thumb,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background-color: var(--scrollbar-thumb-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-corner,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar-corner {
          background-color: var(--scrollbar-background-color);
        }
      `)
    }
  }

  (async function() {
    const script = new Script()
    const webpage = new Webpage()

    script.init()
    script.addScriptMenu()

    webpage.initNoSpoil()
    webpage.initLocationChangeProcess()
    if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      webpage.initSwitchingPartProcess()
    }
    webpage.addStyle()
  })()
})()
