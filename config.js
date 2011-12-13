// this is config.js
// for all possible res, see res.js
// any function(request, response) can be a mapping value
require('./res.js').exportTo(global);

exports.mapping = {
    '/': file('home.htm'),
    'redirect-local': redirect('redirect-target', false),
    'redirect-remote': redirect('http://www.baidu.com', false),
    'redirect-target': content('redirectd!'),
    'empty': empty()
};
exports.rescue = file();

// node dev-server.js --config=config.js --port=10086