var express = require('express')
var helmet = require('helmet')
var os = require("os")
var path = require('path')
var compression = require('compression')

var app = express()
var hostname = os.hostname()
var p = path.join(__dirname, '/html')

// app.use(helmet())
app.use(express.static(p))
// app.use(compression())
app.set('views', p)
app.set('view engine', 'pug')

app.get('/', function (req, res) {
  res.set("Content-Security-Policy", "script-src 'unsafe-inline' https://igv.org/web/release/2.0.1/dist/igv.min.js")
  res.render('index', {
    title: 'igv.js Demo App v1',
    message1: 'IGV.js Web App',
    message2: 'App Version: v1',
    message3: "Hostname: " + hostname,
    genome: "hg19",
    locus: "chr21:9,411,410-9,511,410",
    tracks: [
      {
        type: 'variant',
        sourceType: 'htsget',
        endpoint: 'http://localhost:3333/htsget/v1/',
        id: 'NA18537',
        name: 'NA18537'
      }]
  })
})

app.listen(80, function () {
  console.log('app listening on port 80!')
})
