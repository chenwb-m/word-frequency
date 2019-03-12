const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const XLSX = require('xlsx')
const log = require('../utils/log')



var exportXlsx = function(data, next) {
  function Workbook() {
    if(!(this instanceof Workbook)) return new Workbook();
    this.SheetNames = [];
    this.Sheets = {};
  }
  function datenum(v, date1904) {
    if(date1904) v+=1462;
    var epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
  }
  function insertCell(ws, c, r, v) {
    var cell = {}
    var cell_ref = XLSX.utils.encode_cell({c, r});
    if (v instanceof Date) {
      cell.t = 'n'
      cell.z = XLSX.SSF._table[14];
      cell.v = datenum(cell.v);
    } else if (v==null || v==undefined) {
      cell.t = 's'
      cell.v = ''
    } else {
      cell.t = 's'
      cell.v = v.toString()
    }
    ws[cell_ref] = cell
  }

  if (!data instanceof Array) {
    return next(new Error('not array'));
  }
  if (data.length == 0) {
    return next(new Error('empty data'));
  }
  console.log('exporting', data.length, 'records to xlsx file...');
  try {

    // get fields from data[0]
    var wb = new Workbook()
    var ws_name = "Sheet1";
    var ws = {}
    var range = {
      s: {
        c: 0,
        r: 0
      },
      e: {
        c: 0,
        r: data.length
      }
    };
    var fields = [], f, c, r, i, j;

    r = 0
    c = 0
    for (f in data[0]) {
      fields.push(f)
      insertCell(ws, c, r, f)
      c += 1
    }
    if (c>0) range.e.c = c-1
    else range.e.c = 0


    for (c = 0; c < fields.length; c++) { //列
      f = fields[c];
      for (r = 1; r <= data.length; r++) { //行
        insertCell(ws, c, r, data[r-1][f])
      }
    }

    if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;

    var filename = './upload/exported-' + Date.now() + '.xlsx';
    var filepath = filename;
    XLSX.writeFile(wb, filepath);
    console.log('xlsx file', filepath, 'generated for', data.length, 'records');
    next(null, filename);
  } catch (err) {
    next(err)
  }
}




module.exports = async function (req, res) {
  try {
    var body = req.body || {}
    var file = req.files[0]
    var fileName = file.originalname
    if (!fileName) {
      res.setState(400)
      return res.end('文件名不能为空！')
    }
    var filepath = `./upload/${uuidv4()}${path.extname(fileName)}`
    // log.info(filepath, file.filename, file.originalname, file.name)
    try {
      // move
      await new Promise((resolve, reject) => {
        var source = fs.createReadStream(file.path)
        var dest = fs.createWriteStream(filepath)
        source.on('error', (err) => reject(err))
        source.on('end', () => resolve())
        dest.on('error', (err) => reject(err))
        source.pipe(dest)
      })
    } catch (err) {
      log.error(err)
      res.setState(500)
      return res.end('服务器错误[移动文件错误]！')
    }
    try {
      // delete
      await new Promise((resolve, reject) => {
        fs.unlink(file.path, (err) => {
          err ? reject(err) : resolve()
        })
      })
    } catch (err) {
      log.error(err)
      res.setState(500)
      return res.end('服务器错误[清除文件错误]！')
    }
    var keyObjectCounter = {}
    var workbook = XLSX.readFile(filepath, {cellDates: true, cellNF: false, cellText: false})
    var sheetName = workbook.SheetNames[0]
    var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {cellNF: 'dd/mm/yyyy', header: 1})
    var array = [], value = ''
    var splitValue = []
    for (row in data) {
      array = data[row] || []
      for (col in array) {
        value  = array[col] || ''
        // console.log(value)
        splitValue = value.split(' ')
        for (v of splitValue) {
          if (!keyObjectCounter[v]) {
            keyObjectCounter[v] = {
              key: v,
              count: 0,
              rows: []
            }
          }
          keyObjectCounter[v].count += 1
          keyObjectCounter[v].rows.push(parseInt(row) + 1)
        }
      }
    }
    var range = Object.values(keyObjectCounter).sort((a, b) => a.count > b.count ? -1 : 1)
    var exportData = [['关键词', '频率', '出现行号']]
    range.forEach((row) => {
      exportData.push([row.key, row.count, row.rows.join(', ')])
    })
    // console.log(exportData)
    // 导出
    var outname = ''
    try {
      outname = await new Promise((resolve, reject) => {
        exportXlsx(exportData, (error, filename) => {
          if (error) {
            return reject(error)
          }
          return resolve(filename)
        })
      })
    } catch (err) {
      log.error(err)
      res.setState(500)
      return res.end('服务器错误[导出文件错误]！')
    }
    res.end(outname)

    try {
      // delete
      await new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
          err ? reject(err) : resolve()
        })
      })
    } catch (err) {
      log.error(err)
    }
  } catch (err) {
    log.error(err)
    res.setState(500)
    return res.end('服务器错误[清除文件错误]！')
  }
}