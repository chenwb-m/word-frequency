const fs = require('fs')
const path = require('path')
const express = require('express')

const router = express.Router()
const handle = require('./controllers/handle')

router.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'))
})

const multer = require('multer')
var uploadHandle = multer({
  dest: 'upload'
})
router.post('/upload', uploadHandle.any(), handle)

router.get('/*', (req, res) => {
  res.sendFile(path.resolve('./index.html'))
})

module.exports = router
