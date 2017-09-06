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