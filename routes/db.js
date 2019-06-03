const _ = require('lodash');

class ServiceManager { 
    constructor(){
        this.initializeService = {};
        this.getService = this.getService.bind(this);
        this.initializeService = this.initializeService.bind(this);
    }

    getService(serviceId){
        if( ! _.find(this.initializedServices, serviceId)){
            return this.initializeService(serviceId);
        }

        return this.initializedServices[serviceId];
    }

    initializeService(serviceId){
        const service = new Service(serviceId);

        service.then(srv => {
            this.initializedServices[serviceId] = srv;

            return srv;
        });
    }
}

class AccountManager {
    constructor(){
        this.userData = {
            '0900620000': {
                accountName: 'UCKG Helpline',
            languages: ['english', 'swahili'],
            agents: {
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
            ivr:{
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
            }
        }
    }


    getAccountData(userId){
        if( !_.find(this.userData, userId)){
            return null;
        }

        return this.userData[userId]
    }
}

const accountManager = new AccountManager();

class Service {
    constructor(serviceId){
        return accountManager.getAccountData(serviceId).then(accountData => {
            const {accountName, ivr, agents, languages} = accountData;
            this.accountName = accountName;
            this.ivr = ivr;
            this.agents = agents;
            this.acceptedLanguages = [...languages];
            this.currentSessions = [];
            this.languageAction = {
                say: 'To Continue in english, press 1. Kuendelea kwa kiswahili bonyeza mbili',
                languageOptions: ['english', 'swahili'],
                actionHandler: this.ivr
            }
        })
    }

    getSession(sessionId, options={}){
        if( !_.find(this.currentSessions, sessionId)){
            return this.initializeSession(sessionId, options);
        }

        return this.currentSessions[sessionId];
    }

    initializeSession(sessionId, options){
        const callerPhone = options.callerPhone || null;

        if(!callerPhone){
            return null;
        }

        const newSession = _.merge({}, {
            callerPhone,
            language: options.language || null,
            currentHandler: this.languageAction,
            userHistory: {}
        });

        this.currentSessions[sessionId] = newSession;

        return newSession;
    }

    getNextHandler(sessId, option){
        if( !_.find(this.sessions, sessId)){
            return null;
        }

        if( !option ){
            return null;
        }

        const session = this.sessions[sessId];

        if( !this.hasOptions(session) && this.getChildren(session).length > option){
            return null;
        }

        /**Language configuration object */
        if( session === this.languageAction){
            if(session.languageOptions.length > options){
                return null;
            }

            const language = session.languageOptions[option];

            this.configureLanguageForSession(sessId, language);
            this.updateHandler(session.actionHandler);

            return session.actionHandler;
        }

        // Normal handler 
        const handlerKey = Object.keys(session.children)[option];

        if( !handlerKey){
            return null;
        }

        return session.children[option];

    }

    hasOptions(session){
        // Check if a session handler has keys 
        return session.currentHandler.children !== null;
    }

    getChildren(session){
        // Get all children actions on the current session handler 
        const {children} = session.currentHandler;

        if(!children){
            return [];
        }

        return Object.keys(children);
    }

    configureLanguageForSession(sessId, language){
        if( !_.find(this.sessions, sessId)){
            return null;
        }

        const session = this.sessions[sessId];
        session.language = language;
    }

    handleIncomingRequest(payload){
        const {sessionId, dmtfDigits} = payload;

        const nextHandler = this.getNextHandler(sessionId, dmtfDigits);

        const response = formatResponse(nextHandler);
        this.updateHandler(sessionId, nextHandler);

        return response;
    }

    updateHandler(sessionId, nextHandler){
        const session = this.getSession(sessionId);

        session.currentHandler = nextHandler;
    }

    formatResponse(response){
        // Convert a handler json object into an xml that is easy for AT 
        // Handle rejects first
        /**
         * sample 
         * {
         *      say: {
         *          content: 'For X service press 1, for Y service press 2',
         *          voice: 'female'
         *      },
         *      record: true,
         *      getDigits: {
         *          timeout: 30,
         *          finishOnKey: '#'
         *      }
         * }
         */
        // let config = {
        //     response: {

        //     }
        // }
        // if( response.reject ){
        //     config = {response: {reject: true}}
        // }

        // config = {...config, response}

        return response;

    }

}


// const sessions = {
//     'sessionId001':{
//         agents = {
//             id001: {
//                 agentName: 'Agent Name 1',
//                 userId: 'user001',
//                 phoneNumber: '+25479034823',
//                 preferences: {
//                     language: ['english', 'swahili'],
//                     services: ['serviceId001', 'serviceId002']
//                 }
//             },
//             id002: {
//                 agentName: 'Agent Name 2',
//                 userId: 'user002',
//                 phoneNumber: '+2542139234',
//                 preferences: {
//                     language: ['english', 'swahili'],
//                     services: ['serviceId001', 'serviceId002']
//                 }
//             },
//             id003: {
//                 agentName: 'Agent Name 3',
//                 userId: 'user003',
//                 phoneNumber: '+2549237234',
//                 preferences: {
//                     language: ['english', 'swahili']
//                 }
//             }
//         },
//         ivr = {
//             id001: {
//                 serviceName: 'uckg',
//                 priority: 5,
//                 actions: {
//                     say: true,
//                     record: true,
//                 },
//                 children: {
//                     id003: {
//                         priority: 3,
//                         serviceName: 'Drugs and Alcohol',
//                         actions: {
//                             say: true,
//                             record: true
//                         }
//                     },
//                     id004: {
//                         priority: 1,
//                         serviceName: 'Marriage and Family issues',
//                         actions: {
//                             say: true,
//                             record: true
//                         }
//                     },
//                     id005: {
//                         priority: 2,
//                         serviceName: 'Depression and Anxiety',
//                         actions: {
//                             say: true,
//                             record: true
//                         }
//                     },
//                     id006: {
//                         priority: 4,
//                         serviceName: 'Directions and Program',
//                         actions: {
//                             say: true,
//                             record: true
//                         }
//                     },
//                     id007: {
//                         priority: 5,
//                         serviceName: 'Genral Information',
//                         actions: {
//                             say: true,
//                             record: true
//                         }
//                     }
//                 }
//             }
//         },
//         sessionData: {

//         }
//     }
    

// }

const serviceManager = new ServiceManager();


module.exports = serviceManager;