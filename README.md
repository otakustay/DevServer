# 超简易静态服务器

DevServer是一个由NodeJS开发的超简易服务器，其目标是协助对一些**需要服务器支持的前端效果**进行调试，本身**不可作为泛用服务器**使用。

DevServer**没有**任何错误处理，因此时常会崩溃，好在重启非常快……错误处理会在日后加上。

## 使用方法

1. 
    创建一个`config.js`，用于作为配置项

        // 加载所有自带的响应资源
        require('./res.js').exportTo(global);

        // URL - 资源的映射关系
        exports.mapping = {
            '/': file('home.htm'),
            'redirect-local': redirect('redirect-target', false),
            'redirect-remote': redirect('http://www.baidu.com', false),
            'redirect-target': content('redirectd!'),
            'empty': empty()
        };

        // 当访问没有映射关系的URL时的处理方式，此处指定根据URL查找对应的文件并响应
        exports.rescue = file();

2. 
    启动服务器

        node server.js

`server.js`还带有2个配置项：

* --port=[port]，用于指定监听的端口，默认为**10086**
* --config=[config]，用于指定加载的配置文件的路径，默认为**./config.js**

## 自带资源

### `file([filename], [contentType], [headers])`

使用本地文件的内容响应

* filename - 指定响应的文件名，默认从请求的URL中解析
* contentType - 指定响应的`Content-Type`头，默认使用内部的`mimetype`列表
* headers - 需要额外添加的HTTP头

### `status(status, [content], [contentType], [headers])`

使用指定的状态码进行响应

* status - 指定响应的状态码，如404、204等
* content - 响应的具体内容，默认为空
* contentType - 指定响应的`Content-Type`头，默认使用内部的`mimetype`列表
* headers - 需要额外添加的HTTP头

### `json(o, [headers])`

指定返回某个对象的JSON格式字符串，`Content-Type`头强制为`application/json`

* o - 用于生成响应的JSON串的对象
* headers - 需要额外添加的HTTP头

### `jsonp(o, [callbackKey], [headers])`

以jsonp形式响应请求，并将指定对象的JSON格式作为参数，`Content-Type`头强制为`application/x-javascript`

* o - 用户生成参数的对象
* callbackKey - 回调函数名在请求的querystring中对应的键，默认为`'callback'`
* headers - 需要额外添加的HTTP头

### `delay(time, actual)`

延迟一段时间再响应请求，该资源需要一个真正负责响应的资源，如：

    delay(2000, file('a.txt'))

以上代码表示延迟2秒，并使用`file(a.txt)`产生的资源进行响应

* time - 延迟的毫秒数
* actual - 真正进行响应的资源

### `content(content, [contentType], [headers])`

使用指定的字符串进行响应，强制状态码为`200`

* content - 用于响应的字符串
* contentType - 指定响应的`Content-Type`头，默认使用内部的`mimetype`列表
* headers - 需要额外添加的HTTP头

### `redirect(location, [permanent], [headers])`

返回跳转的状态码

* location - 跳转的目标地址
* permanent - 是否永久跳转，为true时返回`301`，否则返回`302`，默认为`false`
* headers - 需要额外添加的HTTP头

### `empty()`

返回空响应，状态码强制为`200`

## 应用示例

### 检查外部资源加载关系

目标：检查不同资源在各浏览器下加载的优先级

1. 
    生成以下HTML，并保存为`home.htm`

        <html>
        <head>
            <title>Hello World</title>
            <script src="1.js"></script>
            <script src="2.js"></script>
            <link rel="stylesheet" href="1.css" />
            <link rel="stylesheet" href="2.css" />
        </head>
        <body>
            <img src="1.jpg" />
            <script src="3.js"></script>
            <img src="2.jpg" />
            <script src="4.js"></script>
        </body>
        </html>

2. 
    放置任意图片于目录下，命名为`image.jpg`

3. 
    为了保证能看到请求、响应的效果，给每个请求加上2s的延迟，因此生成以下配置：

        require('./res.js').exportTo(global);

        exports.mapping = {
            '/': delay(2000, file('home.htm')),
            '1.js': delay(2000, content('var a = 1;')),
            '2.js': delay(2000, content('var b = 2;')),
            '1.css': delay(2000, empty()),
            '2.css': delay(2000, content('body { color: red }')),
            '1.jpg': delay(2000, file('image.jpg')),
            '2.jpg': delay(2000, file('image.jpg')),
            '3.js': delay(2000, empty()),
            '4.js': delay(2000, empty())
        }

4. 
    运行服务器

        node server.js

5. 
    打开浏览器，输入`http://localhost:10086`，使用Firebug查看瀑布图效果

### 测试ajax与跨域302跳转之间的关系

目标：由于AJAX有跨域安全限制，因此需测试当服务器返回302状态码，并要求跳转到另一个域时，AJAX的返回是什么

1. 
    编写测试用页面，并保存为`home.htm`

        <body>
            <script>
                function test() {
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            console.log(xhr);
                            document.getElementById('log').innerHTML = JSON.stringify(xhr);
                        }
                    };
                    xhr.open('GET', './redirect', true)
                    xhr.send(null);
                }
            </script>
            <button onclick="test();">点击测试</button>
            <p id="log"></p>

2. 
    编写`config.js`

        require('./res.js').exportTo(global);

        exports.mapping = {
            '/': file('home.htm'),
            'redirect': redirect('http://www.google.com')
        }

3. 
    运行服务器

        node server.js

4. 
    打开浏览器，输入`http://localhost:10086`，点击按钮查看测试结果