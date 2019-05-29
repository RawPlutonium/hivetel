import _ from 'lodash';
import firebase from 'firebase/app';


class ServiceManager { 
    initializedServices = {};

    getService = serviceId => {
        if( ! _.find(this.initializedServices, serviceId)){
            return this.initializeService(serviceId);
        }

        return this.initializedServices[serviceId];
    }

    initializeService = serviceId => {
        const service = new Service(serviceId);

        service.then(srv => {
            this.initializedServices[serviceId] = srv;

            return srv;
        });
    }
}

class Service {
    constructor(serviceId){
        return accountManager.getAccountData(serviceId).then(accountData => {
            const {accountName, ivr, agents, languages} = accountData;
            this.accountName = accountName;
            this.ivr = ivr;
            this.agents = agents;
            this.acceptedLanguages = [...languages];
            this.currentSessions = []
        })
    }

    getSession = (sessionId, options={}) => {
        if( !_.find(this.currentSessions, sessionId)){
            return this.initializeSession(sessionId, options);
        }

        return this.currentSessions[sessionId];
    }

    initializeSession = (sessionId, options) => {
        const callerPhone = options.callerPhone || null;

        if(!callerPhone){
            return null;
        }

        const newSession = _.merge({}, {
            callerPhone,
            language: options.language || null,
            currentHandler: this.getDefaultHandler(),
            userHistory: {}
        });

        this.currentSessions[sessionId] = newSession;

        return newSession;
    }

}


const sessions = {
    'sessionId001':{
        agents = {
            id001: {
                agentName: 'Agent Name 1',
                userId: 'user001',
                phoneNumber: '+25479034823',
                preferences: {
                    language: ['english', 'swahili'],
                    services: ['serviceId001', 'serviceId002']
                }
            },
            id002: {
                agentName: 'Agent Name 2',
                userId: 'user002',
                phoneNumber: '+2542139234',
                preferences: {
                    language: ['english', 'swahili'],
                    services: ['serviceId001', 'serviceId002']
                }
            },
            id003: {
                agentName: 'Agent Name 3',
                userId: 'user003',
                phoneNumber: '+2549237234',
                preferences: {
                    language: ['english', 'swahili']
                }
            }
        },
        ivr = {
            id001: {
                serviceName: 'uckg',
                priority: 5,
                actions: {
                    say: true,
                    record: true,
                },
                children: {
                    id003: {
                        priority: 3,
                        serviceName: 'Drugs and Alcohol',
                        actions: {
                            say: true,
                            record: true
                        }
                    },
                    id004: {
                        priority: 1,
                        serviceName: 'Marriage and Family issues',
                        actions: {
                            say: true,
                            record: true
                        }
                    },
                    id005: {
                        priority: 2,
                        serviceName: 'Depression and Anxiety',
                        actions: {
                            say: true,
                            record: true
                        }
                    },
                    id006: {
                        priority: 4,
                        serviceName: 'Directions and Program',
                        actions: {
                            say: true,
                            record: true
                        }
                    },
                    id007: {
                        priority: 5,
                        serviceName: 'Genral Information',
                        actions: {
                            say: true,
                            record: true
                        }
                    }
                }
            }
        },
        sessionData: {

        }
    }
    

}