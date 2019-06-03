const _ = require('lodash');
const Service = require('./service');


function ServiceManager (){
    this.initializedService = {}
}

ServiceManager.prototype.getService = function(serviceId){
    // const service = _.find(this.initializedService, serviceId);
    const service = this.initializedService[serviceId];
    if( !service){
        console.log("Service is absent")
        return this.initializeService(serviceId);
    }


    return new Promise((resolve, reject) => {
        resolve(service)
    });
}

ServiceManager.prototype.initializeService = function(serviceId){
    const service = new Service(serviceId);

    return new Promise((resolve, reject) => {
        service.then(srv => {
            this.initializedService[serviceId] = srv;
            resolve(srv);
        })
    })
    
    
}

const serviceManager = new ServiceManager();

module.exports = serviceManager;