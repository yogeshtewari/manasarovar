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
    var search_resp_header_template = fs.readFileSync('routes/search_resp_header.template', { 'encoding': 'utf8'});
    var search_resp_template = fs.readFileSync('routes/search_resp.template', { 'encoding': 'utf8'});
    var search_resp_footer_template = fs.readFileSync('routes/search_resp_footer.template', { 'encoding': 'utf8'});
    es_resp = search_resp_header_template
    count = 0
    body.hits.hits.forEach(function(elem) {
      count = count + 1
      if(count % 2 ==  0) {
        es_resp = es_resp + search_resp_template.replace(new RegExp('resp_col','g'), 'cyan').replace(new RegExp('resp_id','g'), count).replace(new RegExp('resp_json','g'),JSON.stringify(elem._source, null, 2))
      } else {
        es_resp = es_resp + search_resp_template.replace(new RegExp('resp_col','g'), 'teal').replace(new RegExp('resp_id','g'), count).replace(new RegExp('resp_json','g'),JSON.stringify(elem._source, null, 2))
      }
    })
    es_resp = es_resp + search_resp_footer_template
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
