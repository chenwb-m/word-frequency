var log4js = require('log4js')


/**
 * 使用方法
 *  log.trace(...),
 *  log.debug(...),
 *  log.info(...),
 *  log.warn(...),
 *  log.error(...)
 */

function getLineAndFile (offset) {
  var stack = new Error().stack.split('\n');
  var line = stack[(offset || 1) + 1] ? stack[(offset || 1) + 1].split(':') : '-1'
  var file = line[0].substr(line[0].lastIndexOf('(') + 1)
  file = file.substr(file.lastIndexOf(' ') + 1)
  file = file.substr(file.lastIndexOf('/') + 1)
  return {
    file: file,
    line: parseInt(line[line.length - 2], 10)
  };
}

// const $depth = 11;
log4js.configure({
  appenders: [{
    category: 'console',
    type: 'console',
    layout: {
      type: 'pattern',
      // pattern: '%[[%d{ISO8601}] (%x{line}) %p -%] %m',
      pattern: '%[[%d{yyyy-MM-dd hh:mm:ss}] %p -%] %m',
      tokens: {
        line: () => {
          // The caller:
          var obj = getLineAndFile(10)
          return `${obj.file}, ${obj.line}`
          // return ''
        }
      }
    }
  }, {
    category: 'file',
    type: 'file',
    filename: './filecache.public.ml.healgoo.log',
    maxLogSize: 1024000
  }]
});

const log = log4js.getLogger('console');

log.__defineGetter__('__LINE__', () => getLineAndFile(2).line);
log.__defineGetter__('__FILE__', () => getLineAndFile(2).file);


/**
 * 设置输出级别
 * @type {String}
 */
log.setLevel('TRACE');


/**
 * 声明导出
 * @type {[type]}
 */
module.exports = log
