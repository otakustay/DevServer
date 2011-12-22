var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var util = require('./util');
var url = require('url');

var mimeType = {
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
    png: 'image/png',
    js: 'application/x-javascript',
    css: 'text/css',
    htm: 'text/html',
    html: 'text/html',
    xml: 'text/xml',
    txt: 'text/plain',
    json: 'application/json'
};

var defaultMimeType = 'text/plain';

function getContentType(pathname, specified) {
    if (specified) {
        return specified;
    }

    var extension = path.extname(pathname);
    return mimeType[extension] || defaultMimeType;
};

function writeHeader(response, status, contentType, headers) {
    response.writeHeader(status, util.mix(headers, { 'Content-Type': contentType || defaultMimeType }));
}

exports.exportTo = function(target) {
    for (var key in exports) {
        if (key !== 'exportTo') {
            target[key] = exports[key];
        }
    }
};

exports.file = function(filename, userContentType, headers) {
    return function(request, response) {
        var file = filename || '.' + request.pathname;
        var extension = path.extname(file);
        var contentType = userContentType || mimeType[extension.substring(1)] || defaultMimeType;
        path.exists(file, function(exists) {
            if (exists) {
                fs.readFile(file, function(error, data) {
                    if (error) {
                        writeHeader(response, 500, getContentType(request.pathname, contentType), headers);
                        response.end();
                    }
                    else {
                        writeHeader(response, 200, getContentType(request.pathname, contentType), headers);
                        response.end(data);
                    }
                });
            }
            else {
                writeHeader(response, 404, getContentType(request.pathname, contentType), headers);
            }
        });
    };
};

exports.status = function(status, content, contentType, headers) {
    return function(request, response) {
        writeHeader(response, status, getContentType(request.pathname, contentType), headers);
        response.end(content);
    };
};

exports.json = function(o, headers) {
    return function(request, response) {
        writeHeader(response, 200, 'application/json', headers);
        response.end(JSON.stringify(o));
    };
};

exports.jsonp = function(o, callbackKey, headers) {
    callbackKey = callbackKey || 'callback';
    return function(request, response) {
        var query = querystring.parse(request.search);
        var functionName = query[callbackKey];

        writeHeader(response, 200, 'application/x-javascript', headers);
        response.end(functionName + '(' + JSON.stringify(o) + ');');
    };
};

exports.dumpRequest = function() {
    return function(request, response) {
        var result = {
            url: request.url,
            method: request.method,
            httpVersion: request.httpVersion,
            protocol: request.protocol,
            host: request.host,
            auth: request.auth,
            hostname: request.hostname,
            port: request.port,
            search: request.search,
            hash: request.hash,
            headers: request.headers,
            query: request.query,
            body: request.body
        };

        writeHeader(response, 200, 'application/json');
        response.end(JSON.stringify(result, null, '    '));
    };
};

exports.delay = function(time, actual) {
    return function(request, response) {
        setTimeout(function() { actual(request, response); }, time);
    }
};

// 复用
exports.content = function(content, contentType, headers) {
    return exports.status(200, content, contentType, headers);
};

exports.redirect = function(location, permanent, headers) {
    return exports.status(permanent ? 301 : 302, '', defaultMimeType, util.mix(headers, { 'Location': location }));
};

exports.empty = function() {
    return exports.content('');
};