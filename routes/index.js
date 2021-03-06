var express = require('express');
var serviceManager = require('./services/service-manager');

var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("Getting")
  res.send("Something just like this");
});

router.post('/:serviceId', function(req, res){
  const body = req.body; //Fetch payload

  const serviceId = req.params.serviceId;

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

    res.set(headers).send(resp);
  })
  
})

module.exports = router;
