var express = require('express');
const sessionManager = require('../services/session.manager');

var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/:virtualPhone', function(req, res){
  const body = req.body;
  const {sessionId} = body;

  const virtualPhone = req.params.virtualPhone;

  const manager = sessionManager.getManagerForVirtualPhone(virtualPhone);
  const handler = manager.getHandlerForSession(sessionId);

  const response = handler.getResponse(body);

  res.send({status: 'OK', ...response});
})

module.exports = router;
