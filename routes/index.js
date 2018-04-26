var express = require('express');
var router = express.Router();
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var fs = require("fs");

var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});


const getjson = {
  es_body(body) {
    var search_resp_template = fs.readFileSync('routes/search_resp.template', { 'encoding': 'utf8'});
    es_resp = '<div new_row>'
    count = 0
    body.hits.hits.forEach(function(elem) {
      if(count == 3 || count == 6 || count == 9) {
        es_resp = es_resp + '</div><div class="row">'
      }
      es_resp = es_resp + search_resp_template.replace('es_header', count).replace('es_resp',JSON.stringify(elem._source, null, 2))
      count = count + 1
    })
    es_resp = es_resp + '</div>'
    return es_resp
  }
}

const es = {
  search(search_term) {
    return client.search({
        q: search_term
      })
      .then((body) => getjson.es_body(body)) // just return the body from this method
  }
}

/* POST search page. */
router.post('/search', function(req, res, next) {

  var search_template = fs.readFileSync('routes/search.template', { 'encoding': 'utf8'});
  es.search(req.body.search_term)
    .then(function(data) {
      res.render('index', {
        es_search_section: search_template,
        es_search_resp_section: data
      })
    })
    .catch(next)
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var search_template = fs.readFileSync('routes/search.template', { 'encoding': 'utf8'});
  res.render('index', {
    es_search_resp_section: '',
    es_search_section: search_template
  })
});

module.exports = router;
