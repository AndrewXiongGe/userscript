/* exported UserscriptAPI */
/**
 * UserscriptAPI
 * 
 * 根据使用到的功能，可能需要通过 `@grant` 引入 `GM_xmlhttpRequest` 或 `GM_download`。
 * @version 1.0.0.20210629
 * @author Laster2800
 */
class UserscriptAPI {
  /**
   * @param {Object} [options] 选项
   * @param {string} [options.id='_0'] 标识符
   * @param {string} [options.label] 日志标签，为空时不设置标签
   * @param {number} [options.conditionInterval=100] `wait` 条件 API 默认 `options.interval`
   * @param {number} [options.conditionTimeout=6000] `wait` 条件 API 默认 `options.timeout`
   * @param {number} [options.elementTimeout=10000] `wait` 元素 API 默认 `options.timeout`
   * @param {number} [options.fadeTime=400] UI 渐变时间（单位：ms）
   */
  constructor(options) {
    this.options = {
      id: '_0',
      label: null,
      conditionInterval: 100,
      conditionTimeout: 6000,
      elementTimeout: 10000,
      fadeTime: 400,
      ...options,
    }

    const original = window[`_api_${this.options.id}`]
    if (original) {
      original.options = this.options
      return original
    }
    window[`_api_${this.options.id}`] = this

    const api = this
    const logCss = `
      background-color: black;
      color: white;
      border-radius: 2px;
      padding: 2px;
      margin-right: 2px;
    `

    /** DOM 相关 */
    this.dom = {
      /**
       * 创建 locationchange 事件
       * @see {@link https://stackoverflow.com/a/52809105 How to detect if URL has changed after hash in JavaScript}
       */
      createLocationchangeEvent() {
        if (!unsafeWindow._createLocationchangeEvent) {
          history.pushState = (f => function pushState() {
            const ret = f.apply(this, arguments)
            window.dispatchEvent(new Event('pushstate'))
            window.dispatchEvent(new Event('locationchange'))
            return ret
          })(history.pushState)
          history.replaceState = (f => function replaceState() {
            const ret = f.apply(this, arguments)
            window.dispatchEvent(new Event('replacestate'))
            window.dispatchEvent(new Event('locationchange'))
            return ret
          })(history.replaceState)
          window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('locationchange'))
          })
          unsafeWindow._createLocationchangeEvent = true
        }
      },

      /**
       * 将一个元素绝对居中
       * 
       * 要求该元素此时可见且尺寸为确定值（一般要求为块状元素）。运行后会在 `target` 上附加 `_absoluteCenter` 方法，若该方法已存在，则无视 `config` 直接执行 `target._absoluteCenter()`。
       * @param {HTMLElement} target 目标元素
       * @param {Object} [config] 配置
       * @param {string} [config.position='fixed'] 定位方式
       * @param {string} [config.top='50%'] `style.top`
       * @param {string} [config.left='50%'] `style.left`
       */
      setAbsoluteCenter(target, config) {
        if (!target._absoluteCenter) {
          const defaultConfig = {
            position: 'fixed',
            top: '50%',
            left: '50%',
          }
          config = { ...defaultConfig, ...config }
          target._absoluteCenter = () => {
            const style = getComputedStyle(target)
            const top = (parseFloat(style.height) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) / 2
            const left = (parseFloat(style.width) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)) / 2
            target.style.top = `calc(${config.top} - ${top}px)`
            target.style.left = `calc(${config.left} - ${left}px)`
            target.style.position = config.position
          }

          // 实现一个简单的 debounce 来响应 resize 事件
          let tid
          window.addEventListener('resize', function() {
            if (target && target._absoluteCenter) {
              if (tid) {
                clearTimeout(tid)
                tid = null
              }
              tid = setTimeout(() => {
                target._absoluteCenter()
              }, 500)
            }
          })
        }
        target._absoluteCenter()
      },

      /**
       * 处理 HTML 元素的渐显和渐隐
       * @param {boolean} inOut 渐显/渐隐
       * @param {HTMLElement} target HTML 元素
       * @param {() => void} [callback] 处理完成的回调函数
       */
      fade(inOut, target, callback) {
        // fadeId 等同于当前时间戳，其意义在于保证对于同一元素，后执行的操作必将覆盖前的操作
        const fadeId = new Date().getTime()
        target._fadeId = fadeId
        if (inOut) { // 渐显
          // 只有 display 可视情况下修改 opacity 才会触发 transition
          if (getComputedStyle(target).display == 'none') {
            target.style.display = 'unset'
          }
          setTimeout(() => {
            let success = false
            if (target._fadeId <= fadeId) {
              target.style.opacity = '1'
              success = true
            }
            callback && callback(success)
          }, 10) // 此处的 10ms 是为了保证修改 display 后在浏览器上真正生效，按 HTML5 定义，浏览器需保证 display 在修改 4ms 后保证生效，但实际上大部分浏览器貌似做不到，等个 10ms 再修改 opacity
        } else { // 渐隐
          target.style.opacity = '0'
          setTimeout(() => {
            let success = false
            if (target._fadeId <= fadeId) {
              target.style.display = 'none'
              success = true
            }
            callback && callback(success)
          }, api.options.fadeTime)
        }
      },

      /**
       * 为 HTML 元素添加 `class`
       * @param {HTMLElement} el 目标元素
       * @param {string} className `class`
       */
      addClass(el, className) {
        if (el instanceof HTMLElement) {
          if (!el.className) {
            el.className = className
          } else {
            const clz = el.className.split(' ')
            if (clz.indexOf(className) < 0) {
              clz.push(className)
              el.className = clz.join(' ')
            }
          }
        }
      },

      /**
       * 为 HTML 元素移除 `class`
       * @param {HTMLElement} el 目标元素
       * @param {string} [className] `class`，未指定时移除所有 `class`
       */
      removeClass(el, className) {
        if (el instanceof HTMLElement) {
          if (typeof className == 'string') {
            if (el.className == className) {
              el.className = ''
            } else {
              let clz = el.className.split(' ')
              clz = clz.reduce((prev, current) => {
                if (current != className) {
                  prev.push(current)
                }
                return prev
              }, [])
              el.className = clz.join(' ')
            }
          } else {
            el.className = ''
          }
        }
      },

      /**
       * 判断 HTML 元素类名中是否含有 `class`
       * @param {HTMLElement | {className: string}} el 目标元素
       * @param {string | string[]} className `class`，支持同时判断多个
       * @param {boolean} [and] 同时判断多个 `class` 时，默认采取 `OR` 逻辑，是否采用 `AND` 逻辑
       * @returns {boolean} 是否含有 `class`
       */
      containsClass(el, className, and = false) {
        const trim = clz => clz.startsWith('.') ? clz.slice(1) : clz
        if (el instanceof HTMLElement || typeof el.className == 'string') {
          if (el.className == trim(String(className))) {
            return true
          } else {
            const clz = el.className.split(' ')
            if (className instanceof Array) {
              if (and) {
                for (const c of className) {
                  if (clz.indexOf(trim(c)) < 0) {
                    return false
                  }
                }
                return true
              } else {
                for (const c of className) {
                  if (clz.indexOf(trim(c)) >= 0) {
                    return true
                  }
                }
                return false
              }
            } else {
              return clz.indexOf(trim(className)) >= 0
            }
          }
        }
        return false
      },

      /**
       * 判断 HTML 元素是否为 `fixed` 定位，或其是否在 `fixed` 定位的元素下
       * @param {HTMLElement} el 目标元素
       * @param {HTMLElement} [endEl] 终止元素，当搜索到该元素时终止判断（不会判断该元素）
       * @returns {boolean} HTML 元素是否为 `fixed` 定位，或其是否在 `fixed` 定位的元素下
       */
      isFixed(el, endEl) {
        while (el instanceof HTMLElement && el != endEl) {
          if (window.getComputedStyle(el).position == 'fixed') {
            return true
          }
          el = el.parentNode
        }
        return false
      },
    }
    /** 信息通知相关 */
    this.message = {
      /**
       * 创建信息
       * @param {string} msg 信息
       * @param {Object} [config] 设置
       * @param {boolean} [config.autoClose=true] 是否自动关闭信息，配合 `config.ms` 使用
       * @param {number} [config.ms=1500] 显示时间（单位：ms，不含渐显/渐隐时间）
       * @param {boolean} [config.html=false] 是否将 `msg` 理解为 HTML
       * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
       * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，相当于设置为 `{ top: '70%', left: '50%' }`
       * @return {HTMLElement} 信息框元素
       */
      create(msg, config) {
        const defaultConfig = {
          autoClose: true,
          ms: 1500,
          html: false,
          width: null,
          position: {
            top: '70%',
            left: '50%',
          },
        }
        config = { ...defaultConfig, ...config }

        const msgbox = document.body.appendChild(document.createElement('div'))
        msgbox.className = `${api.options.id}-msgbox`
        if (config.width) {
          msgbox.style.minWidth = 'auto' // 为什么一个是 auto 一个是 none？真是神奇的设计
          msgbox.style.maxWidth = 'none'
          msgbox.style.width = config.width
        }

        msgbox.style.display = 'block'
        setTimeout(() => {
          api.dom.setAbsoluteCenter(msgbox, config.position)
        }, 10)

        if (config.html) {
          msgbox.innerHTML = msg
        } else {
          msgbox.innerText = msg
        }
        api.dom.fade(true, msgbox, () => {
          if (config.autoClose) {
            setTimeout(() => {
              this.close(msgbox)
            }, config.ms)
          }
        })
        return msgbox
      },

      /**
       * 关闭信息
       * @param {HTMLElement} msgbox 信息框元素
       */
      close(msgbox) {
        if (msgbox) {
          api.dom.fade(false, msgbox, () => {
            msgbox && msgbox.remove()
          })
        }
      },

      /**
       * 创建高级信息
       * @param {HTMLElement} el 启动元素
       * @param {string} msg 信息
       * @param {string} flag 标志信息
       * @param {Object} [config] 设置
       * @param {string} [config.flagSize='1.8em'] 标志大小
       * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
       * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，沿用 `UserscriptAPI.message.create()` 的默认设置
       * @param {() => boolean} [config.disabled] 是否处于禁用状态
       */
      advanced(el, msg, flag, config) {
        const defaultConfig = {
          flagSize: '1.8em',
          // 不能把数据列出，否则解构的时候会出问题
        }
        config = { ...defaultConfig, ...config }

        const _self = this
        el.show = false
        el.onmouseenter = function() {
          if (config.disabled && config.disabled()) {
            return
          }

          const htmlMsg = `
            <table class="gm-advanced-table"><tr>
              <td style="font-size:${config.flagSize};line-height:${config.flagSize}">${flag}</td>
              <td>${msg}</td>
            </tr></table>
          `
          this.msgbox = _self.create(htmlMsg, { ...config, html: true, autoClose: false })

          // 可能信息框刚好生成覆盖在 el 上，需要做一个处理
          this.msgbox.onmouseenter = function() {
            this.mouseOver = true
          }
          // 从信息框出来也会关闭信息框，防止覆盖的情况下无法关闭
          this.msgbox.onmouseleave = function() {
            _self.close(this)
          }
        }
        el.onmouseleave = function() {
          setTimeout(() => {
            if (this.msgbox && !this.msgbox.mouseOver) {
              this.msgbox.onmouseleave = null
              _self.close(this.msgbox)
            }
          })
        }
      },
    }
    /** 用于等待元素加载/条件达成再执行操作 */
    this.wait = {
      /**
       * 在条件满足后执行操作
       *
       * 当条件满足后，如果不存在终止条件，那么直接执行 `callback(result)`。
       *
       * 当条件满足后，如果存在终止条件，且 `stopTimeout` 大于 0，则还会在接下来的 `stopTimeout` 时间内判断是否满足终止条件，称为终止条件的二次判断。
       * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 `onStop()` 而非 `callback(result)`。
       * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(result)`。
       *
       * @param {Object} options 选项
       * @param {() => *} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
       * @param {(result) => void} [options.callback] 当满足条件时执行 `callback(result)`
       * @param {number} [options.interval=UserscriptAPI.options.conditionInterval] 检测时间间隔（单位：ms）
       * @param {number} [options.timeout=UserscriptAPI.options.conditionTimeout] 检测超时时间，检测时间超过该值时终止检测（单位：ms）；设置为 `0` 时永远不会超时
       * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
       * @param {() => *} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`（包括终止条件的二次判断达成）
       * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
       * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
       * @param {(e) => void} [options.onError] 条件检测过程中发生错误时执行 `onError()`
       * @param {boolean} [options.stopOnError] 条件检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {() => boolean} 执行后终止检测的函数
       */
      executeAfterConditionPassed(options) {
        options = {
          callback: result => api.logger.info(result),
          interval: api.options.conditionInterval,
          timeout: api.options.conditionTimeout,
          onTimeout: () => api.logger.error(['TIMEOUT', 'executeAfterConditionPassed', options]),
          stopCondition: null,
          onStop: () => api.logger.error(['STOP', 'executeAfterConditionPassed', options]),
          stopInterval: 50,
          stopTimeout: 0,
          onError: () => api.logger.error(['ERROR', 'executeAfterConditionPassed', options]),
          stopOnError: false,
          timePadding: 0,
          ...options,
        }

        let tid
        let stop = false
        let cnt = 0
        let maxCnt
        if (options.timeout === 0) {
          maxCnt = 0
        } else {
          maxCnt = (options.timeout - options.timePadding) / options.interval
        }
        const task = async () => {
          let result = null
          try {
            result = await options.condition()
          } catch (e) {
            options.onError && options.onError.call(options, e)
            if (options.stopOnError) {
              clearInterval(tid)
            }
          }
          const stopResult = options.stopCondition && await options.stopCondition()
          if (stop) {
            clearInterval(tid)
          } else if (stopResult) {
            clearInterval(tid)
            options.onStop && options.onStop.call(options)
          } else if (maxCnt !== 0 && ++cnt > maxCnt) {
            clearInterval(tid)
            options.onTimeout && options.onTimeout.call(options)
          } else if (result) {
            clearInterval(tid)
            if (options.stopCondition && options.stopTimeout > 0) {
              this.executeAfterConditionPassed({
                condition: options.stopCondition,
                callback: options.onStop,
                interval: options.stopInterval,
                timeout: options.stopTimeout,
                onTimeout: () => options.callback.call(options, result)
              })
            } else {
              options.callback.call(options, result)
            }
          }
        }
        setTimeout(() => {
          tid = setInterval(task, options.interval)
          task()
        }, options.timePadding)
        return function() {
          stop = true
        }
      },

      /**
       * 等待 DOM 中出现特定元素
       * @param {Object} options 选项
       * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [options.base=document] 基元素
       * @param {HTMLElement[]} [options.exclude] 若 `element` 在其中则跳过，并继续检测
       * @param {(element: HTMLElement) => void} [options.callback] 当 `element` 加载成功时执行 `callback(element)`
       * @param {boolean} [options.subtree=true] 是否将检测范围扩展为基元素的整棵子树
       * @param {boolean} [options.multiple] 若一次检测到多个目标元素，是否在所有元素上执行回调函数（否则只处理第一个结果）
       * @param {boolean} [options.repeat] `element` 加载成功后是否继续检测
       * @param {number} [options.timeout=UserscriptAPI.options.elementTimeout] 检测超时时间，检测时间超过该值时终止检测（单位：ms）；设置为 `0` 时永远不会超时
       * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
       * @param {(e) => void} [options.onError] 检测过程中发生错误时执行 `onError()`
       * @param {boolean} [options.stopOnError] 检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {() => boolean} 执行后终止检测的函数
       */
      executeAfterElementLoaded(options) {
        options = {
          base: document,
          exclude: null,
          callback: el => api.logger.info(el),
          subtree: true,
          multiple: false,
          repeat: false,
          timeout: api.options.elementTimeout,
          onTimeout: () => api.logger.error(['TIMEOUT', 'executeAfterElementLoaded', options]),
          onError: () => api.logger.error(['ERROR', 'executeAfterElementLoaded', options]),
          stopOnError: false,
          timePadding: 0,
          ...options,
        }

        let loaded = false
        let stopped = false

        const stop = () => {
          if (!stopped) {
            stopped = true
            ob.disconnect()
          }
        }

        const isExcluded = element => {
          return options.exclude && options.exclude.indexOf(element) >= 0
        }

        const task = root => {
          let success = false
          if (options.multiple) {
            const elements = root.querySelectorAll(options.selector)
            if (elements.length > 0) {
              for (const element of elements) {
                if (!isExcluded(element)) {
                  success = true
                  options.callback.call(options, element)
                }
              }
            }
          } else {
            const element = root.querySelector(options.selector)
            if (element && !isExcluded(element)) {
              success = true
              options.callback.call(options, element)
            }
          }
          loaded = success || loaded
          return success
        }

        const repeatTask = records => {
          let success = false
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (addedNode instanceof HTMLElement) {
                const virtualRoot = document.createElement('div')
                virtualRoot.appendChild(addedNode.cloneNode())
                const el = virtualRoot.querySelector(options.selector)
                if (el && !isExcluded(addedNode)) {
                  success = true
                  loaded = true
                  options.callback.call(options, addedNode)
                  if (!options.multiple) {
                    return true
                  }
                }
                success = task(addedNode) || success
                if (success && !options.multiple) {
                  return true
                }
              }
            }
          }
        }

        const ob = new MutationObserver(records => {
          try {
            if (options.repeat) {
              repeatTask(records)
            } else {
              task(options.base)
            }
            if (loaded && !options.repeat) {
              stop()
            }
          } catch (e) {
            options.onError && options.onError.call(options, e)
            if (options.stopOnError) {
              stop()
            }
          }
        })

        setTimeout(() => {
          try {
            task(options.base)
          } catch (e) {
            options.onError && options.onError.call(options, e)
            if (options.stopOnError) {
              stop()
            }
          }
          if (!stopped) {
            if (!loaded || options.repeat) {
              ob.observe(options.base, {
                childList: true,
                subtree: options.subtree,
              })
              if (options.timeout > 0) {
                setTimeout(() => {
                  if (!stopped) {
                    if (!loaded || options.repeat) {
                      stop()
                    }
                    if (!loaded) {
                      options.onTimeout && options.onTimeout.call(options)
                    }
                  }
                }, Math.max(options.timeout - options.timePadding, 0))
              }
            }
          }
        }, options.timePadding)
        return stop
      },

      /**
       * 等待条件满足
       * 
       * 执行细节类似于 {@link executeAfterConditionPassed}。在原来执行 `callback(result)` 的地方执行 `resolve(result)`，被终止或超时执行 `reject()`。
       * @async
       * @see executeAfterConditionPassed
       * @param {Object} options 选项
       * @param {() => *} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
       * @param {number} [options.interval=UserscriptAPI.options.conditionInterval] 检测时间间隔（单位：ms）
       * @param {number} [options.timeout=UserscriptAPI.options.conditionTimeout] 检测超时时间，检测时间超过该值时终止检测（单位：ms）；设置为 `0` 时永远不会超时
       * @param {() => *} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
       * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
       * @param {boolean} [options.stopOnError] 条件检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {Promise} `result`
       * @throws 当等待超时或者被终止时抛出
       */
      async waitForConditionPassed(options) {
        return new Promise((resolve, reject) => {
          this.executeAfterConditionPassed({
            ...options,
            callback: result => resolve(result),
            onTimeout: function() {
              reject(['TIMEOUT', 'waitForConditionPassed', this])
            },
            onStop: function() {
              reject(['STOP', 'waitForConditionPassed', this])
            },
            onError: function(e) {
              reject(['ERROR', 'waitForConditionPassed', this, e])
            },
          })
        })
      },

      /**
       * 等待元素加载
       * 
       * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
       * @async
       * @see executeAfterElementLoaded
       * @param {Object} options 选项
       * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [options.base=document] 基元素
       * @param {HTMLElement[]} [options.exclude] 若 `element` 在其中则跳过，并继续检测
       * @param {boolean} [options.subtree=true] 是否将检测范围扩展为基元素的整棵子树
       * @param {number} [options.timeout=UserscriptAPI.options.elementTimeout] 检测超时时间，检测时间超过该值时终止检测（单位：ms）；设置为 `0` 时永远不会超时
       * @param {boolean} [options.stopOnError] 检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {Promise<HTMLElement>} `element`
       * @throws 当等待超时时抛出
       */
      async waitForElementLoaded(options) {
        return new Promise((resolve, reject) => {
          this.executeAfterElementLoaded({
            ...options,
            callback: element => resolve(element),
            onTimeout: function() {
              reject(['TIMEOUT', 'waitForElementLoaded', this])
            },
            onError: function() {
              reject(['ERROR', 'waitForElementLoaded', this])
            },
          })
        })
      },

      /**
       * 元素加载选择器
       * 
       * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
       * @async
       * @see executeAfterElementLoaded
       * @param {string} selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [base=document] 基元素
       * @param {boolean} [subtree=true] 是否将检测范围扩展为基元素的整棵子树
       * @returns {Promise<HTMLElement>} `element`
       * @throws 当等待超时时抛出
       */
      async waitQuerySelector(selector, base = document, subtree = true) {
        const options = { selector, base, subtree }
        return new Promise((resolve, reject) => {
          this.executeAfterElementLoaded({
            ...options,
            callback: element => resolve(element),
            onTimeout: function() {
              reject(['TIMEOUT', 'waitQuerySelector', this])
            },
            onError: function() {
              reject(['ERROR', 'waitQuerySelector', this])
            },
          })
        })
      },
    }
    /** 网络相关 */
    this.web = {
      /** @typedef {Object} GM_xmlhttpRequest_details */
      /** @typedef {Object} GM_xmlhttpRequest_response */
      /**
       * 发起网络请求
       * @async
       * @param {GM_xmlhttpRequest_details} details 定义及细节同 {@link GM_xmlhttpRequest} 的 `details`
       * @returns {Promise<GM_xmlhttpRequest_response>} 响应对象
       * @throws 当请求发生错误或者超时时抛出
       * @see {@link https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest GM_xmlhttpRequest}
       */
      async request(details) {
        if (details) {
          return new Promise((resolve, reject) => {
            const throwHandler = function(msg) {
              api.logger.error('NETWORK REQUEST ERROR')
              reject(msg)
            }
            details.onerror = details.onerror || (() => throwHandler(['ERROR', 'request', details]))
            details.ontimeout = details.ontimeout || (() => throwHandler(['TIMEOUT', 'request', details]))
            details.onload = details.onload || (response => resolve(response))
            GM_xmlhttpRequest(details)
          })
        }
      },

      /** @typedef {Object} GM_download_details */
      /**
       * 下载资源
       * @param {GM_download_details} details 定义及细节同 {@link GM_download} 的 `details`
       * @returns {() => void} 用于终止下载的方法
       * @see {@link https://www.tampermonkey.net/documentation.php#GM_download GM_download}
       */
      download(details) {
        if (details) {
          try {
            const cfg = { ...details }
            let name = cfg.name
            if (name.indexOf('.') > -1) {
              let parts = cfg.url.split('/')
              const last = parts[parts.length - 1].split('?')[0]
              if (last.indexOf('.') > -1) {
                parts = last.split('.')
                name = `${name}.${parts[parts.length - 1]}`
              } else {
                name = name.replaceAll('.', '_')
              }
              cfg.name = name
            }
            if (!cfg.onerror) {
              cfg.onerror = function(error, details) {
                api.logger.error('DOWNLOAD ERROR')
                api.logger.error([error, details])
              }
            }
            if (!cfg.ontimeout) {
              cfg.ontimeout = function() {
                api.logger.error('DOWNLOAD TIMEOUT')
              }
            }
            GM_download(cfg)
          } catch (e) {
            api.logger.error('DOWNLOAD ERROR')
            api.logger.error(e)
          }
        }
        return () => {}
      },

      /**
       * 判断给定 URL 是否匹配
       * @param {RegExp | RegExp[]} reg 用于判断是否匹配的正则表达式，或正则表达式数组
       * @param {'SINGLE' | 'AND' | 'OR'} [mode='SINGLE'] 匹配模式
       * @returns {boolean} 是否匹配
       */
      urlMatch(reg, mode = 'SINGLE') {
        let result = false
        const href = location.href
        if (mode == 'SINGLE') {
          if (reg instanceof Array) {
            if (reg.length > 0) {
              reg = reg[0]
            } else {
              reg = null
            }
          }
          if (reg) {
            result = reg.test(href)
          }
        } else {
          if (!(reg instanceof Array)) {
            reg = [reg]
          }
          if (reg.length > 0) {
            if (mode == 'AND') {
              result = true
              for (const r of reg) {
                if (!r.test(href)) {
                  result = false
                  break
                }
              }
            } else if (mode == 'OR') {
              for (const r of reg) {
                if (r.test(href)) {
                  result = true
                  break
                }
              }
            }
          }
        }
        return result
      },
    }
    /**
     * 日志
     */
    this.logger = {
      /**
       * 打印格式化日志
       * @param {*} message 日志信息
       * @param {string} label 日志标签
       * @param {boolean} [error] 是否错误信息
       */
      log(message, label, error) {
        const output = console[error ? 'error' : 'log']
        const type = typeof message == 'string' ? '%s' : '%o'
        output(`%c${label}%c${type}`, logCss, '', message)
      },

      /**
       * 打印日志
       * @param {*} message 日志信息
       */
      info(message) {
        if (message === undefined) {
          message = '[undefined]'
        } else if (message === null) {
          message = '[null]'
        } else if (message === '') {
          message = '[empty string]'
        }
        if (api.options.label) {
          this.log(message, api.options.label)
        } else {
          console.log(message)
        }
      },

      /**
       * 打印错误日志
       * @param {*} message 错误日志信息
       */
      error(message) {
        if (message === undefined) {
          message = '[undefined]'
        } else if (message === null) {
          message = '[null]'
        } else if (message === '') {
          message = '[empty string]'
        }
        if (api.options.label) {
          this.log(message, api.options.label, true)
        } else {
          console.error(message)
        }
      },
    }

    const css = document.head.appendChild(document.createElement('style'))
    css.id = `_api_${api.options.id}-css`
    css.type = 'text/css'
    css.innerHTML = `
      :root {
        --light-text-color: white;
        --shadow-color: #000000bf;
      }

      .${api.options.id}-msgbox {
        z-index: 65535;
        background-color: var(--shadow-color);
        font-size: 16px;
        max-width: 24em;
        min-width: 2em;
        color: var(--light-text-color);
        padding: 0.5em 1em;
        border-radius: 0.6em;
        opacity: 0;
        transition: opacity ${api.options.fadeTime}ms ease-in-out;
        user-select: none;
      }

      .${api.options.id}-msgbox .gm-advanced-table td {
        vertical-align: middle;
      }
      .${api.options.id}-msgbox .gm-advanced-table td:first-child {
        padding-right: 0.6em;
      }
    `
  }
}