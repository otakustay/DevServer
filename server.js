var http = require('http');
var url = require('url');
var path = require('path');
var querystring = require('querystring');
var util = require('./util.js');
var res = require('./res.js');

// 解析参数
var args = {};
process.argv.slice(2).forEach(function(item) {
    var pair = item.split('=');
    args[pair[0].substring(2).trim()] = pair[1].trim();
});

var config = require('./' + (args.config || 'config.js'));
config.mapping = config.mapping || {};

function handle(request, response) {
    console.log(request.method + ': ' + request.url);
    
    util.extend(request, url.parse(request.url));
    request.query = request.search ? querystring.parse(request.search.substring(1)) : {};

    var handler = config.mapping[request.url] || config.rescue || res.notFound;
    handler(request, response);
};

var server = http.createServer(handle);
server.listen(args.port || 10086);
console.log('listen on ' + (args.port || 10086));
