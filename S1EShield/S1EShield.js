// ==UserScript==
// @name            S1战斗力屏蔽
// @namespace       laster2800
// @version         3.1.0.20210510
// @author          Laster2800
// @description     屏蔽S1的战斗力系统，眼不见为净
// @author          Laster2800
// @icon            https://www.saraba1st.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/394407
// @supportURL      https://greasyfork.org/zh-CN/scripts/394407/feedback
// @license         LGPL-3.0
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=928340
// @match           *.saraba1st.com/*
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_addStyle
// @run-at          document-start
// ==/UserScript==

const gmId = 'gm394407'
const enabledAttr = `${gmId}-enabled`
const enabledSelector = `body[${enabledAttr}]`

/* global API */
var api = new API({ id: gmId })

;(function() {
  api.wait.waitForElementLoaded('body').then(body => {
    body.setAttribute(enabledAttr, '')
  })

  // 在导航栏中加入脚本开关
  api.wait.waitForElementLoaded('#nv').then(nv => {
    var sw = document.createElement('label')
    sw.innerHTML = `
      <span>战斗力系统</span>
      <input type="checkbox" style="vertical-align:middle">
    `
    sw.style = 'float:right;padding:0 15px;height:33px;line-height:33px;font-weight:bold;font-size:1.2em'
    nv.appendChild(sw)

    sw.enabled = true
    sw.lastElementChild.onclick = function() {
      const enabled = !sw.enabled
      const body = document.body
      if (enabled) {
        body.setAttribute(enabledAttr, '')
      } else {
        body.removeAttribute(enabledAttr)
      }
      sw.enabled = enabled
    }
  })

  // 系统提醒
  api.wait.waitForElementLoaded({
    selector: '#myprompt_menu',
    interval: 5,
  }).then(menu => {
    // 有系统提醒时，每次打开页面时都会弹出一个通知菜单
    // 点击网页提供的关闭按键后，此菜单在有新提醒前不会再次弹出
    api.wait.waitForElementLoaded({
      selector: '.ignore_notice',
      interval: 5,
      timeout: 1000,
    }).then(ignore_notice => {
      api.wait.waitForConditionPassed({
        condition: () => menu.getAttribute('initialized') === 'true',
        interval: 5,
      }).then(() => ignore_notice.click())
    })
    // 有系统提醒处于未读状态时，相关位置会有高亮显示，网页标题也会有所不同
    // 将这些差异化显示，在用户没有反应出来之前去除
    api.wait.waitForElementLoaded({
      selector: '#myprompt',
      interval: 5,
    }).then(menu_button => {
      var menu_mypost = menu.querySelector('.notice_mypost') // 右上角菜单「我的帖子」
      var menu_system = menu.querySelector('.notice_system') // 右上角菜单「系统提醒」
      if (menu_mypost || menu_system) {
        menu_button.innerText = '提醒'
        menu_button.className = 'a showmenu'
        // 极小概率的情况下，此时页面标题已经改变（貌似只会发生在后台打开时），覆盖以确保处理
        replaceTitle()
        // 常规情况下的处理
        Object.defineProperty(document, 'title', {
          set: function() {
            setTimeout(replaceTitle)
          }
        })
      }
      menu_system && menu_system.parentNode.parentNode.remove()
    })
  })

  // 右上角「积分」的弹出菜单移除
  api.wait.waitForElementLoaded('#extcreditmenu').then(extcreditmenu => {
    extcreditmenu.className = ''
    extcreditmenu.style.paddingRight = '1em'
    extcreditmenu.onmouseover = null
  })

  if (/thread-|mod=viewthread/.test(location.href)) {
    GM_addStyle(`
      /* 层主头像下方的战斗力显示 */
      ${enabledSelector} .favatar > div.tns.xg2 > table > tbody > tr > th:nth-child(2) {
        display: none;
      }
      /* 楼层评分 */
      ${enabledSelector} .plhin > tbody > tr:nth-child(1) > .plc > .pct > .pcb > .psth,
      ${enabledSelector} .plhin > tbody > tr:nth-child(1) > .plc > .pct > .pcb > .rate {
        display: none;
      }
    `)
  } else if (/ac=credit/.test(location.href)) {
    // [设置 > 积分] 页面中的相关项屏蔽
    GM_addStyle(`
      /* [我的积分] 页中战斗力显示 */
      ${enabledSelector} #ct .creditl > li:nth-child(2),
      /* [我的积分] 页中的 [积分显示] */
      ${enabledSelector} #ct table.dt.mtm,
      /* [积分记录] */
      ${enabledSelector} #ct li:nth-child(4) {
        display: none;
      }
    `)
  } else if (/mod=space(&|$)/.test(location.href)) { // 「个人主页」或「通知」页面
    // 屏蔽个人资料中的战斗力显示
    if (/do=profile/.test(location.href)) {
      GM_addStyle(`
        ${enabledSelector} #psts > ul > li:nth-child(3) {
          display: none;
        }
      `)
    }

    // 如果当前在 [通知 > 系统提醒]，重定向
    if (/view=system/.test(location.href)) {
      location.replace('https://bbs.saraba1st.com/2b/home.php?mod=space&do=pm')
    }
    // [通知 > 系统提醒] 整项屏蔽
    GM_addStyle(`
      ${enabledSelector} #ct > .appl > .tbn > ul > li:nth-child(4) {
        display: none;
      }
    `)
  } else if (/space-uid-/.test(location.href)) {
    // 屏蔽用户主页中的战斗力显示
    GM_addStyle(`
      ${enabledSelector} #psts > ul > li:nth-child(3) {
        display: none;
      }
    `)
  }
})()

function replaceTitle() {
  // eslint-disable-next-line no-irregular-whitespace
  var reg = /^【新提醒】|【　　　】/
  if (reg.test(document.title)) {
    document.title = document.title.replace(reg, '')
  }
}