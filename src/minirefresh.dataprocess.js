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