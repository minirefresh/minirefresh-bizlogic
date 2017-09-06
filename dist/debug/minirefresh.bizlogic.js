/**
 * minirefresh biz的数据处理实现，将接口返回处理成统一数据格式，方便处理
 * 由于不同的项目不同可能是不同的数据规范，因此单独独立出来，方便统一修改
 * 命名空间直接绑在了 MiniRefreshTools 上
 * 通过插拔式增加各种接口的支持
 */
(function(innerUtil) {

    /**
     * 常量
     */
    var STATUS_SUCCESS = 1,
        STATUS_ERROR = 0,
        // 返回一个错误，代表没有获取到数据
        RETURN_TYPE_ERROR = null;

    /**
     * 获取这个模块下对应命名空间的对象
     * 如果不存在，则返回null，这个api只要是供内部获取接口数据时调用
     * @param {Object} module 对应的模块
     * @param {Array} namespace 对应的命名空间
     * @return {Object} 返回找到后的对象引用
     */
    innerUtil.getNameSpaceObj = function(module, namespace) {
        if (!namespace) {
            return RETURN_TYPE_ERROR;
        }
        var namespaceArr = namespace.split('.'),
            len = namespaceArr.length;
            
        for (var i = 0; i < len; i++) {
            module && (module = module[namespaceArr[i]]);
        }
        
        return module;
    };

    /**
     * 处理数据的函数池，绑在util上，便于拓展
     */
    innerUtil.dataProcessFn = [];

    /**
     * 统一处理返回数据,返回数据必须符合标准才行,否则会返回错误提示
     * @param {JSON} response 接口返回的数据
     * @param {Object} options 配置信息，包括
     * dataPath 手动指定处理数据的路径，遇到一些其它数据格式可以手动指定
     * 可以传入数组，传入数组代表回一次找path，直到找到为止或者一直到最后都没找到
     * isDebug 是否是调试模式，调试模式会返回一个debugInfo节点包含着原数据
     * 其它:无法处理的数据,会返回对应错误信息
     * @return {JSON} 返回的数据,包括多个成功数据,错误提示等等
     */
    innerUtil.dataProcess = function(response, options) {
        options = options || {};

        // 永远不要试图修改arguments，请单独备份，否则在严格模式和非严格模式下容易出现错误
        var args = [].slice.call(arguments);
        var result = {
            // code默认为0代表失败，1为成功
            code: STATUS_ERROR,
            // 描述默认为空
            message: '',
            // 数据默认为空
            data: RETURN_TYPE_ERROR,
            // 一些数据详情,可以协助调试用
            debugInfo: {
                type: '未知数据格式'
            }
        };

        if (options.dataPath === undefined) {
            // 不需要处理
            return response;
        }

        if (typeof options.dataPath === 'string') {
            options.dataPath = [options.dataPath];
        }

        // 默认为详情
        var isDebug = options.isDebug || false,
            paths = options.dataPath,
            processFns = innerUtil.dataProcessFn,
            len = processFns.length,
            num = paths.length,
            isFound = false;

        if (!response) {
            result.message = '接口返回数据为空!';

            return result;
        }
        // 添加一个result，将返回接口给子函数
        args.push(result);
        for (var k = 0; !isFound && k < num; k++) {
            // 每次动态修改path参数
            args[1] = paths[k];

            for (var i = 0; !isFound && i < len; i++) {
                var fn = processFns[i];
                var returnValue = fn.apply(this, args);

                if (returnValue && returnValue.data !== RETURN_TYPE_ERROR) {
                    // 找到了或者到了最后一个就退出
                    if (returnValue.code === STATUS_SUCCESS || k === num - 1) {
                        isFound = true;
                        result = returnValue;
                        break;
                    }
                }
            }
        }

        if (!isFound) {
            // 没有找到数据需要使用默认
            // 如果没有数据处理函数或数据格式不符合任何一个函数的要求
            result.message = '没有数据处理函数或者接口数据返回格式不符合要求!';
            // 装载数据可以调试
            result.debugInfo.data = response;
        }

        // 非null代表已经找到格式了，这个是通过约定越好的
        if (!isDebug) {
            result.debugInfo = undefined;
        }

        return result;
    };

})(MiniRefreshTools);
/**
 * dataprocess 的v6项目数据，可插拔
 */
(function(innerUtil) {
    
    /**
     * 常量
     */
    var STATUS_SUCCESS = 1,
        STATUS_ERROR = 0,
        // 返回一个错误，代表没有获取到数据
        RETURN_TYPE_ERROR = null;
    
    /**
     * 通过指定路径，来获取对应的数据
     * 如果不符合数据要求的，请返回null，这样就会进入下一个函数处理了
     * @param {JSON} response 接口返回的数据
     * @param {String} path 一个自定义路径，以点分割，用来找数据
     * @param {JSON} returnValue 返回数据
     * 1:返回列表
     * 其它:返回详情
     * @return {JSON} 返回的数据,包括多个成功数据,错误提示等等
     * */
    function handleDataByPathV6(response, path, returnValue) {
        if (!(path && response && response.ReturnInfo && response.BusinessInfo)) {
            return RETURN_TYPE_ERROR;
        }
        var debugInfo = {
            type: 'v6数据格式:' + path
        };
        var returnInfo = response.ReturnInfo,
            businessInfo = response.BusinessInfo;

        if (+returnInfo.Code === STATUS_SUCCESS) {
            if (+businessInfo.Code === STATUS_SUCCESS) {
                returnValue.code = STATUS_SUCCESS;

                var data = innerUtil.getNameSpaceObj(response, path);

                if (data) {
                    returnValue.data = data;
                } else {
                    returnValue.message = returnValue.message || '指定路径下没有找到数据';
                    returnValue.data = null;
                }
            } else {
                returnValue.code = STATUS_ERROR;
                returnValue.message = businessInfo.Description || '接口请求错误,后台业务逻辑处理出错!';
            }
        } else {
            returnValue.code = STATUS_ERROR;
            returnValue.message = returnInfo.Description || '接口请求错误,后台程序处理出错!';
        }

        returnValue.debugInfo = debugInfo;
        
        return returnValue;
    }
    
    /**
     * 添加到数据处理回调上
     */
    innerUtil.dataProcessFn.push(handleDataByPathV6);
})(MiniRefreshTools);
/**
 * dataprocess 的v7项目数据，可插拔
 */
(function(innerUtil) {
    
    /**
     * 常量
     */
    var STATUS_SUCCESS = 1,
        STATUS_ERROR = 0,
        STATUS_SUCCESS_HTTP = 200,
        // 返回一个错误，代表没有获取到数据
        RETURN_TYPE_ERROR = null;

    /**
     * 判断返回状态码是否成功
     * @param {Number} code 默认是数字型，兼容可能出现字符串的情况
     * @return {Boolean} 是匹配成功状态
     */
    var isStatusCodeSuccess = function(code) {
        // 支持两个成功状态码，HTTP成功码或者定义的success码
        return +code === STATUS_SUCCESS || +code === STATUS_SUCCESS_HTTP;
    };

    /**
     * 通过错误代码换取对应的错误提示
     * @param {Number} code 默认是数字型，兼容可能出现字符串的情况
     * @return {String} 返回对应的错误提示
     */
    var getErrorTipsByCode = function(code) {
        var defaultTips = 'status状态错误';

        if (+status.code === 401) {
            defaultTips = '不合法的输入参数';
        } else if (+status.code === 402) {
            defaultTips = '身份认证失败';
        } else if (+status.code === 500) {
            defaultTips = '接口运行错误';
        } else if (+status.code === 300) {
            defaultTips = '业务错误';
        }
        
        return defaultTips;
    };

    /**
     * 通过指定路径，来获取对应的数据
     * 如果不符合数据要求的，请返回null，这样就会进入下一个函数处理了
     * @param {JSON} response 接口返回的数据
     * @param {String} path 一个自定义路径，以点分割，用来找数据
     * @param {JSON} returnValue 返回数据
     * 1:返回列表
     * 其它:返回详情
     * @return {JSON} 返回的数据,包括多个成功数据,错误提示等等
     * */
    function handleDataByPathV7(response, path, returnValue) {
        if (!(path && response && response.status && response.custom)) {
            return RETURN_TYPE_ERROR;
        }
        var debugInfo = {
            type: 'v7数据格式:' + path
        };
        var status = response.status;

        // 对应状态码,v7数据格式单独增加一个status字段
        returnValue.status = status.code;
        returnValue.message = status.text;
        if (isStatusCodeSuccess(status.code)) {
            returnValue.code = STATUS_SUCCESS;
            
            var data = innerUtil.getNameSpaceObj(response, path);

            if (data) {

                returnValue.data = data;
            } else {
                returnValue.message = returnValue.message || '指定路径下没有找到数据';
                returnValue.data = null;
            }
        } else {
            // 请求失败的情况暂时使用接口返回的默认提示
            returnValue.code = STATUS_ERROR;

            returnValue.message = returnValue.message || getErrorTipsByCode(status.code);
        }

        returnValue.debugInfo = debugInfo;

        return returnValue;
    }

    innerUtil.dataProcessFn.push(handleDataByPathV7);
})(MiniRefreshTools);
/**
 * minirefresh针对业务层面的二次封装
 * 包括接口数据自动处理，上拉翻页自动处理等
 */
(function(globalContext, factory) {
    'use strict';

    // 不重复执行
    var moduleExports = globalContext.MiniRefreshBiz || factory(globalContext);

    if (typeof module !== 'undefined' && module.exports) {
        // 用exports，导出一个MiniRefreshBiz对象
        exports.MiniRefreshBiz = moduleExports;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        // require模式默认导出整个工具类
        define(function() {
            return moduleExports;
        });
    }
    
    globalContext.MiniRefreshBiz = moduleExports;
})(typeof window !== 'undefined' ? window : global, function(globalContext) {
    'use strict';
    
    /**
     * 一些默认的数据，例如
     * 默认的主题
     */
    var LOG_TYPE_LOG = 'log',
        LOG_TYPE_WARN = 'warn',
        LOG_TYPE_ERROR = 'error';
        
    var innerUtil = window.MiniRefreshTools,
        defaultTheme = window.MiniRefresh,
        // 模板渲染引擎默认使用 mustache
        renderTemplateEngine = window.Mustache,
        // 当前使用的dom操作库，这里面直接使用库的委托监听功能
        globalDomLib = window.mui,
        ajaxRequest = mui.ajax,
        // 采用统一的数据处理方式，获得统一数据
        dataProcess = innerUtil.dataProcess;

    /**
     * 通过判断是否支持tap来决定点击的是tap还是click
     */
    var touchSupport = ('ontouchstart' in document),
        tapEventName = touchSupport ? 'tap' : 'click';

    var defaultSetting = {
        // 是否是debug模式,如果是的话会输出错误提示
        isDebug: false,
        // 默认的下拉刷新容器选择器
        container: '#minirefresh',
        // 默认的列表数据容器选择器
        listContainer: '#listdata',
        type: 'POST',
        // 默认的请求页面,根据不同项目服务器配置而不同,正常来说应该是0
        initPageIndex: 0,
        // 得到url 要求是一个函数(返回字符串) 或者字符串
        url: null,
        // 得到模板 要求是一个函数(返回字符串) 或者字符串
        template: '#item-template',
        // 得到请求参数 必须是一个函数,因为会根据不同的分页请求不同的数据,该函数的第一个参数是当前请求的页码
        dataRequest: null,
        // 改变数据的函数,代表外部如何处理服务器端返回过来的数据
        // 如果没有传入,则采用内部默认的数据处理方法
        dataChange: null,
        // 列表元素点击回调，传入参数是  e,即目标对象
        itemClick: null,
        // 请求成功,并且成功处理后会调用的成功回调方法,传入参数是成功处理后的数据
        success: null,
        // 请求失败后的回调,可以自己处理逻辑,默认请求失败不做任何提示
        error: null,
        // 下拉刷新回调,这个回调主要是为了自动映射时进行数据处理
        pullDown: null,
        // 是否请求完数据后就自动渲染到列表容器中,如果为false，则不会
        // 代表需要自己手动在成功回调中自定义渲染
        isAutoRender: true,
        // 表监听元素选择器,默认为给li标签添加标签
        itemSelector: 'li',
        // 下拉刷新后的延迟访问时间,单位为毫秒
        delay: 0,
        // 默认的请求超时时间
        timeout: 6000,

        /* ajax的Accept,不同的项目中对于传入的Accept是有要求的
         * 传入参数,传null为使用默认值
         * 示例
         * {
         * script: 'text/javascript, application/javascript, application/x-javascript',
         * json: 'application/json;charset=utf-8'
         * 等等(详情看源码)
         * }
         */
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: 'application/json',
            xml: 'application/xml, text/xml',
            html: 'text/html',
            text: 'text/plain'
        },
        // 默认的contentType
        contentType: 'application/x-www-form-urlencoded',
        // 自定义头部默认为空
        headers: null,
        setting: {
            // 下拉有关
            down: {
                // 可以自定义自己的设置
            },
            // 上拉有关
            up: {
                // 可以自定义自己的设置
                isAuto: true
            }
        }
    };

    /**
     * 将string字符串转为html对象,默认创一个div填充
     * @param {String} strHtml 目标字符串
     * @return {HTMLElement} 返回处理好后的html对象,如果字符串非法,返回null
     */
    function pareseHtml(strHtml) {
        if (typeof strHtml !== 'string') {
            return strHtml;
        }
        // 创一个灵活的div
        var i,
            a = document.createElement('div');
        var b = document.createDocumentFragment();

        a.innerHTML = strHtml;
        
        while ((i = a.firstChild)) {
            b.appendChild(i);
        }

        return b;
    }

    /**
     * 组件的构造函数
     * @param {Object} options 配置参数，和init以及initData的一致
     * @constructor
     */
    function MiniRefreshBizlogic(options) {
        var self = this;

        options = innerUtil.extend(true, {}, defaultSetting, options);

        // 准备改变 template的默认值
        var template = options.template;

        if ((typeof template === 'string' && /^[.#]/.test(template)) || template instanceof HTMLElement) {
            // 这个代表仅仅是模板
            var templateDom = innerUtil.selector(template);

            if (templateDom) {
                template = templateDom.innerHTML.toString() || '';
            }
        }

        options.template = template;

        // 生成下拉刷新对象,有一个默认值
        var MiniRefreshBase = options.theme || defaultTheme;

        if (!MiniRefreshBase) {
            throw new Error('错误:请检查传入的minirefresh主题是否正确!');
        }

        // 下拉刷新基础的设置
        var setting = options.setting;

        // 需要修改setting的container指向真实container
        setting.container = options.container;

        if (setting.down) {
            setting.down.callback = function() {
                self._pullDownCallback();
            };
        }
        if (setting.up) {
            setting.up.callback = function() {
                self._pullUpCallback();
            };
        }

        this.container = innerUtil.selector(options.container);
        this.listContainer = innerUtil.selector(options.listContainer);
        this.options = options;
        this.setting = setting;

        this._initParams();

        // 生成真正的下拉刷新示例对象，要在参数初始化完毕后生成
        this.instance = new MiniRefreshBase(setting);

        this._addEvent();
    }

    /**
     * 定义原型
     */
    MiniRefreshBizlogic.prototype = {

        /**
         * 统一控制台输出
         * @param {String} type 类别
         * @param {String} msg 需要输出的信息
         */
        _log: function(type, msg) {
            if (this.options.isDebug) {
                console[type](msg);
            }
        },
        _initParams: function() {
            // 是否不可以加载更多,如果某些的返回数据为空,代表不可以加载更多了
            this.isNoMoreData = false;
            // 初始化当前页
            this.currPage = this.options.initPageIndex;
            if (this.setting.up && this.setting.up.auto) {
                // 如果初始化请求,当前页面要减1
                this.currPage--;
            }
        },

        /**
         * 下拉回调
         */
        _pullDownCallback: function() {
            var self = this,
                options = this.options;

            if (!this.loadingDown) {
                // 清空 -下拉的时候不清空,请求成功或者失败后再清空
                // 下拉标记,为了回复的时候进行辨别
                this.isPullDown = true;
                this.loadingDown = true;
                this.currPage = options.initPageIndex;
                
                // 延迟delayTime毫秒访问
                setTimeout(function() {
                    self._ajaxRequest();
                }, options.delay);

                // 下拉刷新回调
                options.pullDown && options.pullDown();
            }
        },

        /**
         * 上拉回调
         */
        _pullUpCallback: function() {
            var self = this;

            if (!this.loadingUp) {
                this.isPullDown = false;
                this.loadingUp = true;

                this.currPage++;

                setTimeout(function() {
                    self._ajaxRequest();
                }, this.options.delay);
            }
        },
        _clearResponseEl: function() {
            this.options.isAutoRender && this.listContainer && (this.listContainer.innerHTML = '');
        },

        /**
         * 渲染下拉刷新的模板，返回渲染的数据条数
         * @param {Object} response 接口返回的数据
         * @return {Number} 实际渲染的数据调试
         */
        _render: function(response) {
            var options = this.options;

            var dataLen = 0;

            if (options.isAutoRender) {
                // 如果自动渲染
                // 如果是下拉加载 先清空
                if (this.isPullDown) {
                    this._clearResponseEl();
                }

                // 必须包含Mustache
                if (renderTemplateEngine) {
                    if (response && Array.isArray(response) && response.length > 0) {
                        var outList = '';

                        for (var i = 0, len = response.length; i < len; i++) {
                            var value = response[i];
                            // 默认模版
                            var template = '',
                                optionsTemplate = options.template;

                            if (optionsTemplate) {
                                if (typeof optionsTemplate === 'string') {
                                    // 如果模板是字符串
                                    template = optionsTemplate;
                                } else if (typeof optionsTemplate === 'function') {
                                    // 如果模板是函数
                                    template = optionsTemplate(value);
                                }
                            }
                            outList += renderTemplateEngine.render(template, value);
                            dataLen++;
                        }
                        if (outList !== '') {
                            this.listContainer.appendChild(pareseHtml(outList));
                        }
                    } else {
                        // 没有返回数据,代表不可以加载更多
                        this.isNoMoreData = true;
                    }
                } else {
                    this.isNoMoreData = true;
                    this._log(LOG_TYPE_ERROR, 'error***没有包含mustache文件,无法进行模板渲染');
                }
            }

            return dataLen;
        },

        /**
         * 内置的默认数据转换函数
         * @param {JSON} response 需要转变的数据
         * @return {Object} 转换完后的标准数据
         */
        _dataChangeDefault: function(response) {
            // 数据都使用通用处理方法
            var result = dataProcess(response, {
                dataPath: ['custom.infoList', 'custom.infolist', 'UserArea.InfoList']
            });

            return result.data;
        },
        _ajaxRequest: function() {
            var self = this,
                options = this.options;

            if (!options.url) {
                // 如果url不存在
                this._log(LOG_TYPE_ERROR, 'error***url无效,无法访问');
                // 触发错误回调
                this._errorRequest(null, null, '请求url为空!');

                return;
            }

            var next = function(requestData) {
                var url = '';

                if (typeof options.url === 'function') {
                    url = options.url();
                } else {
                    url = options.url;
                }

                ajaxRequest({
                    url: url,
                    data: requestData,
                    dataType: 'json',
                    timeout: options.timeout,
                    type: options.type,
                    // 接受的头
                    accepts: options.accepts,
                    // 自定义头部
                    headers: options.headers,
                    // contentType
                    contentType: options.contentType,
                    success: function(response) {
                        self._successRequest(response);
                    },
                    error: function(xhr, status) {
                        self._errorRequest(xhr, status, '请求失败!');
                    }
                });
            };

            if (options.dataRequest) {
                var requestData = options.dataRequest(this.currPage, function(requestData) {
                    next(requestData);
                });

                if (requestData !== undefined) {
                    next(requestData);
                }

            } else {
                this._log(LOG_TYPE_WARN, 'warning***请注意dataRequest不存在,默认数据为空');
                next();
            }
        },

        /**
         * 请求失败回调
         * @param {JSON} xhr xhr对象
         * @param {Number} status 状态
         * @param {String} msg 描述
         */
        _errorRequest: function(xhr, status, msg) {
            var options = this.options;

            // 没有返回数据,代表不可以加载更多
            this._refreshState(false);
            this.currPage--;
            this.currPage = this.currPage >= options.initPageIndex ? this.currPage : options.initPageIndex;
            options.error && options.error(xhr, status, msg);
        },

        /**
         * 成功回调
         * @param {JSON} response 成功返回数据
         */
        _successRequest: function(response) {
            var options = this.options;

            if (!response) {
                this._log(LOG_TYPE_WARN, 'warning***返回的数据为空,请注意！');

                this.isNoMoreData = true;
                this._refreshState(false);

                return;
            }
            
            this._log(LOG_TYPE_LOG, '下拉刷新返回数据:' + JSON.stringify(response));

            if (options.dataChange) {
                // 如果存在转换数据的函数,用外部提供的
                response = options.dataChange(response);
            } else {
                // 使用默认的数据转换
                response = this._dataChangeDefault(response);
            }

            var dataLen = this._render(response);

            if (this.loadingMoreSuccess) {
                this.loadingMoreSuccess();
                this.loadingMoreSuccess = null;
            }

            // 成功后的回调方法
            if (options.success && typeof options.success === 'function') {
                // 如果回调函数存在,第二个参数代表是否是下拉刷新请求的,如果是,则是代表需要重新刷新数据
                options.success(response, this.isPullDown || (this.currPage === options.initPageIndex));
            }

            this._refreshState(true, dataLen);
        },

        /**
         * 重置状态
         * @param {Boolean} isSuccess 是否请求成功
         * @param {Number} dataLen 更新的数据条数
         */
        _refreshState: function(isSuccess, dataLen) {
            var instance = this.instance;

            dataLen = dataLen || 0;
            if (this.isPullDown) {
                // 如果是下拉刷新，设置更新了多少条数据等等
                instance.endDownLoading(isSuccess, '更新' + dataLen + '条数据');
                // 不管是下拉刷新还是上拉加载,都要刷新加载更多状态
                // 如果加载更多是否已经结束了
                if (this.isNoMoreData) {
                    // 重置加载更多
                    instance.resetUpLoading();
                    // 又可以加载更多
                    this.isNoMoreData = false;
                }
            }
            // 恢复上拉加载
            instance.endUpLoading(this.isNoMoreData);

            this.loadingDown = false;
            this.loadingUp = false;
        },

        /**
         * 增加监听事件
         * 目前用mui的监听
         */
        _addEvent: function() {
            var listContainer = this.listContainer,
                options = this.options,
                itemClick = options.itemClick;

            if (typeof itemClick === 'function') {
                globalDomLib(listContainer).on(tapEventName, options.itemSelector, itemClick);
            }
        },

        /**
         * 刷新,这里默认为清空,并触发一次加载更多
         */
        refresh: function() {
            var options = this.options;

            if (!options.up || this.instance.options.up.isLock) {
                // 如果不存在上拉加载
                this._clearResponseEl();
                this._pullDownCallback();
            } else if (!this.loadingUp) {
                // 存在上拉加载
                // 清空以前容器中的数据
                this._clearResponseEl();
                // 当前页变为初始页-1  因为会处罚上拉回调,默认将页数+1
                this.currPage = options.initPageIndex - 1;
                this.loadingMore();
            }
        },

        /**
         * 增加加载更多的翻页功能
         * @param {Function} callback 成功回调
         */
        loadingMore: function(callback) {
            var instance = this.instance;

            // 只会用一次的，用完即可删除
            this.loadingMoreSuccess = callback;
            // 手动将状态设为可以加载更多
            if (this.isNoMoreData) {
                // 重置加载更多
                instance.resetUpLoading();
                this.isNoMoreData = false;
            }
            // 触发一次加载更多
            instance.triggerUpLoading();
        },
        
        /**
         * 刷新minirefresh的配置，关键性的配置请不要更新，如容器，回调等
         * @param {Object} setting 新的配置，会覆盖原有的
         */
        refreshSetting: function(setting) {
            this.setting = innerUtil.extend(true, {}, this.setting, setting);
            this.instance.refreshOptions(this.setting);
        },

        /**
         * 将需要暴露的destroy绑定到了 原型链上
         */
        destroy: function() {

            globalDomLib(this.listContainer).off();

            this.container = null;
            this.listContainer = null;
            this.instance = null;
            this.options = null;

        }
    };

    return MiniRefreshBizlogic;
});