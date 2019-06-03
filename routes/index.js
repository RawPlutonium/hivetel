var express = require('express');
var serviceManager = require('./services/service-manager');

var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/:serviceId', function(req, res){
  const body = req.body; //Fetch payload

  const serviceId = req.params.serviceId;

  console.log("Service id ", serviceId);

  const service = serviceManager.getService(serviceId);

  service.then(srv => {
    const response = srv.handleIncomingRequest(body);

    // Extract headers, statuses and stuff 
    const {status} = response;

    if( status !== "OK"){
      console.log("Error processing request");
    }

    const {headers} = response;
    const resp  = response.response;

    res.header(headers).send(resp);
  })
  
})

module.exports = router;
