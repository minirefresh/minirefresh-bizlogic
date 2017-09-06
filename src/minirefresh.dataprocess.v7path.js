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