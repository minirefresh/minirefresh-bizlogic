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