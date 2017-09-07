# minirefresh-bizlogic

对minirefresh进行二次业务封装，包括接口数据自动处理，上拉翻页自动处理等

可以用极简的代码实现一个完整的下拉刷新功能

## 示例

[https://minirefresh.github.io/minirefresh-bizlogic/examples/](https://minirefresh.github.io/minirefresh-bizlogic/examples/)

## 引入

__在`MiniRefresh`已经引入的基础上__

```html
<script type="text/javascript" src="xxx/minirefresh.bizlogic.js"></script>
```

### `require`引入

```js
var MiniRefreshBiz = require('xxx/minirefresh.bizlogic.js');
```

### `import`引入

```js
import { MiniRefreshBiz } from 'xxx/minirefresh.bizlogic.js';
```

## 页面布局

__DOM结构__

```html
<!-- minirefresh开头的class请勿修改 -->
<div id="minirefresh" class="minirefresh-wrap">
    <div class="minirefresh-scroll">        
    </div>
</div>
```

__列表渲染模板__

```html
<script type="text/x-tpl" id="item-template">
    <li class="list-item" id="{{guid}}">
        <h3 class="msg-title">
            {{title}}
        </h3>
        <span class="msg-fs14 msg-date">
            {{date}}
        </span>
    </li>            
</script>
```

## 初始化

```js
new MiniRefreshBiz({
    url: 'xxxxxx',
    dataRequest: function(currPage) {
        return JSON.stringify({
            token: 'RXBvaW50X1dlYlNlcml2Y2VfKiojIzA2MDE=',
            params: {
                pageIndex: currPage,
                pageSize: 10,
                keyword: 'type1'
            }
        });
    },
    itemClick: function(e) {
        console.log("点击item");
    }
});
```

__参数说明__

| 参数 | 参数类型  | 说明  |
| :------------- |:-------------:|:-------------|
| container | String或HTMLElement | 轮播的容器，默认为`#pullrefresh` |
| url | String | `必填`，请求的url |
| theme | String | `必填`，对应主题，默认为`MiniRefresh`（即最后一个引人的主题），可以传入自定义主题以强制使用，譬如`MiniRefreshTools.theme.defaults` |
| dataRequest | String或JSON或Function | `必填`，请求的数据，为函数时请将数据返回出去|
| listContainer | String或HTMLElement | 列表数据容器选择器，默认为`#listdata` |
| itemSelector | String或HTMLElement | 列表元素选择器，默认为`li` |
| isDebug | Boolean | 是否调试，调试模式下会输出一些信息，默认为`false` |
| type | String | 请求类别，`GET`或`POST`，默认为`POST` |
| template | String或Function | 元素渲染的模板，可以是一个模板字符串，也可以是一个`DOM`对象的selector，也可以是函数，为函数时，确保返回模板字符串，默认为selector`#item-template` |
| initPageIndex | Number | 接口请求的初始页面,根据不同项目服务器配置而不同,默认为`0` |
| pageSize | Number | 每次请求的分页大小，默认为`10` |
| timeout | Number | 每次请求的最大超时时间，默认为`6000` |
| delay | Number | 延迟请求的时间，单位为毫秒，默认为`0` |
| dataChange | Function | 用来改变返回数据的回调函数，当接口返回不符合标准规范时，需要手动处理数据并返回标准格式 |
| itemClick | Function | 每一个列表元素被点击时的回调 |
| success | Function | 每次请求成功后的回调函数，回调的数据是处理过后的 |
| error | Function | 每次请求失败后的回调，默认不做处理 |
| pullDown | Function | 下拉刷新事件回调，每次下拉刷新后会触发 |
| isAutoRender | Boolean | 是否自动渲染，默认为`true`，如果为`false`，则可以自己手动在下拉刷新回调或者成功回调中渲染数据 |
| contentType | String | ajax的配置项，默认为`application/x-www-form-urlencoded` |
| headers | JSON | ajax的配置项，默认为`null` |
| accepts | JSON | ajax的配置项，可以参考示例设置 |
| setting | Object | `minirefresh`的配置项，参考下面的setting示例 |

__setting示例__

__如果是引入了各种主题，还可以有设置各种主题对应的配置信息__

参考: [http://www.minirefresh.com/minirefresh-doc/themes/theme_default.html](http://www.minirefresh.com/minirefresh-doc/themes/theme_default.html)

```js
{
    // 下拉有关
    down: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动下拉刷新
        isAuto: false,
        // 设置isAuto=true时生效，是否在初始化的下拉刷新触发事件中显示动画，如果是false，初始化的加载只会触发回调，不会触发动画
        isAllowAutoLoading: true,
        // 是否不管任何情况下都能触发下拉刷新，为false的话当上拉时不会触发下拉
        isAways: false,
        // 是否scroll在下拉时会进行css移动，通过关闭它可以实现自定义动画
        isScrollCssTranslate: true,
        // 下拉要大于多少长度后再下拉刷新
        offset: 75,
        // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
        dampRate: 0.3,
        // 回弹动画时间
        bounceTime: 300,
        successAnim: {
            // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
            isEnable: false,
            duration: 300
        },
        // 下拉时会提供回调，默认为null不会执行
        onPull: null,
        // 取消时回调
        onCalcel: null,
        callback: innerUtil.noop
    },
    // 上拉有关
    up: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动上拉加载-初始化是是否自动
        isAuto: true,
        // 是否默认显示上拉进度条，可以通过API改变
        isShowUpLoading: true,
        // 距离底部高度(到达该高度即触发)
        offset: 100,
        loadFull: {
            // 开启配置后，只要没满屏幕，就会自动加载
            isEnable: true,
            delay: 300
        },
        // 滚动时会提供回调，默认为null不会执行
        onScroll: null,
        callback: innerUtil.noop
    },
    // 容器
    container: '#minirefresh',
    // 是否锁定横向滑动，如果锁定则原生滚动条无法滑动
    isLockX: true
}
```


## 数据格式约束

依赖的接口数据格式，下拉刷新支持两种标准格式: `V7标准`和`V6标准`

__这两个是内置的业务数据格式，可以自行在源码中修改，或者通过`dataChange`使用自定义数据__

V7标准

```js
{
    "custom": {
        "infolist": []
    },
    "status": {
        "text": "请求成功",
        "code": 200
    }
}
```

V6标准

```js
{
    "ReturnInfo": {
        "Code": "1",
        "Description": ""
    },
    "BusinessInfo": {
        "Code": "1",
        "Description": ""
    },
    "UserArea": {
        "InfoList": []
    }
}
```

## API

生成的`miniRefreshBiz`对象可以调用如下API

```js
var miniRefreshBiz = new MiniRefreshBiz(...);
```

### refresh()

会清空列表容器中的数据,并触发一次加载更多(如果禁用了加载更多，会触发下拉刷新)

```js
miniRefreshBiz.refresh();
```

### loadingMore(callback)

主动触发一次加载更多

```js
miniRefreshBiz.loadingMore(callback);
```

__参数说明__

| 参数 | 参数类型  | 说明  |
| :------------- |:-------------:|:-------------|
| callback | Function | 加载成功后的回调，加载失败不会触发，回调只会触发一次 |

### refreshSetting(setting)

重置`minirefresh`的配置项，设置有立马生效

效果等同于`minirefresh`的`refreshOptions`

参考: [http://www.minirefresh.com/minirefresh-doc/api/api_minirefresh.html#refreshoptionsoptions](http://www.minirefresh.com/minirefresh-doc/api/api_minirefresh.html#refreshoptionsoptions)

```js
miniRefreshBiz.refreshSetting(setting);
```

__参数说明__

| 参数 | 参数类型  | 说明  |
| :------------- |:-------------:|:-------------|
| setting | Object | 新的配置信息，对应`minirefresh`的配置项 |

## `minirefresh`对象

可以通过`miniRefreshBiz.instance`来获取到`minirefresh`对象，可以调用它的API

__调用前请确保自己熟悉`minirefresh`的API__

API参考: [http://www.minirefresh.com/minirefresh-doc/api/api_minirefresh.html#api方法](http://www.minirefresh.com/minirefresh-doc/api/api_minirefresh.html#api方法)
