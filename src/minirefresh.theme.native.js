/**
 * 增加一个在使用原生容器效果的下拉刷新
 * 分别在钉钉和EJS环境下使用了对应的刷新库
 * 分别依赖DD和EJS库文件
 */
(function(innerUtil, globalContext) {
    var os = {
        ejs: navigator.userAgent.match(/EpointEJS/i),
        dd: navigator.userAgent.match(/DingTalk/i)
    };
  
    /**
     * 强制锁定下拉，转而使用原生的下拉
     */
    var customizeSetting = {
        down: {
            isLock: true
        },
        // 强行使用body滚动
        isUseBodyScroll: true
    };

    var MiniRefreshTheme = innerUtil.theme.defaults.extend({

        /**
         * 拓展自定义的配置
         * @param {Object} options 配置参数
         */
        init: function(options) {
            // 注意，个性化的配置在后面
            options = innerUtil.extend(true, {}, options, customizeSetting);
            this._super(options);
        },

        /**
         * 这里初始化下拉的调用
         */
        _initDownWrap: function() {
            var self = this;

            if (os.dd) {
                // 钉钉环境
                dd.ui.pullToRefresh.enable({
                    onSuccess: function() {
                        self.options.down.callback && self.options.down.callback();
                    },
                    onFail: function() {
                        dd.ui.pullToRefresh.stop();
                    }
                });
            } else if (os.ejs) {
                // ejs环境
                if (ejs.nativeUI) {
                    // 2.x
                    ejs.nativeUI.pullToRefresh.enable(function() {
                        self.options.down.callback && self.options.down.callback();
                    });
                } else if (ejs.ui) {
                    // 3.x
                    ejs.ui.pullToRefresh.enable({
                        success: function() {
                            self.options.down.callback && self.options.down.callback();
                        },
                        error: function() {
                            ejs.ui.pullToRefresh.stop();
                        }
                    });
                }
            }
        },

        /**
         * 重写下拉重置
         */
        endDownLoading: function() {
            if (os.dd) {
                dd.ui.pullToRefresh.stop();
            } else if (os.ejs) {
                if (ejs.nativeUI) {
                    ejs.nativeUI.pullToRefresh.stop();
                } else {
                    ejs.ui.pullToRefresh.stop();
                }
            }
            
            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            this._resetUpLoading();
        },
        // 将所有下拉相关都重写
        _pullHook: function(downHight, downOffset) {},
        _downLoaingHook: function() {},
        _downLoaingSuccessHook: function() {},
        _downLoaingEndHook: function(isSuccess) {},
        _cancelLoaingHook: function() {},
        _lockDownLoadingHook: function(isLock) {}
    });

    // 挂载主题，这样多个主题可以并存
    innerUtil.namespace('theme.natives', MiniRefreshTheme);

    // 覆盖全局对象，使的全局对象只会指向一个最新的主题
    globalContext.MiniRefresh = MiniRefreshTheme;

})(MiniRefreshTools, typeof window !== 'undefined' ? window : global);