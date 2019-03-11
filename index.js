const http = require('http')
const express = require('express')
const path = require('path')
const morgan = require('morgan')
const colors = require('colors/safe')
const bodyParser = require('body-parser')
const config = require('./config')
const log = require('./utils/log')

let app = express()

// CORS middleware
const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}

// Start Server
const startServer = () => new Promise((resolve, reject) => {
  const indexRouter = require('./routes')

  app.use(morgan('dev'))
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))
  app.use(bodyParser.raw({ type: 'text/xml' }))
  app.use('/upload', express.static(path.join(__dirname, './upload')))
  app.use('/static', express.static(path.join(__dirname, './static')))
  app.set('views', path.resolve(__dirname, './views/ejs'))
  app.set('view engine', 'ejs')
  app.options('*', allowCrossDomain, (req, res) => {res.sendStatus(200)})
  app.use('/', indexRouter)

  // instance
  const server = http.createServer(app)
  server.listen(config.port, '0.0.0.0', (err) => {
    err ? reject(err) : resolve()
  })
  server.on('error', (err) => {
    log.error(err)
  })
})



// Run
const run = async () => {
  var env = process.env.NODE_ENV === 'production' ? 'Production' : 'Develop'
  try {
    log.info(`---------------- ${colors.magenta('Word Frequency Counter Server')} ----------------`)
    log.info(`-> Server run in ${colors.magenta(env)} model`)
    // 启动web服务
    log.info('-> Starting server ...')
    await startServer()
    log.info(`-> Server listen on ${colors.magenta(config.port)}`)
  } catch (err) {
    log.error(err)
  }
}

run()

