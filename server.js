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

    util.extend(request, url.parse(request.url, true));
    var pathname = (request.pathname.length > 1 && request.pathname.charAt(0) === '/') ? 
        request.pathname.substring(1) : request.pathname;
    var handler = config.mapping[pathname] || config.rescue || res.notFound;

    if (handler) {
        request.body = '';
        request.setEncoding('utf-8');
        request.on('data', function(chunk) { request.body += chunk; });
        request.on('end', function() { handler(request, response); })
    }
    else {
        response.writeHeader(404);
        response.end();
    }
};

var server = http.createServer(handle);
server.listen(args.port || 10086);
console.log('listen on ' + (args.port || 10086));
