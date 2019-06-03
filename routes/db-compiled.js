'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var ServiceManager = function () {
    function ServiceManager() {
        _classCallCheck(this, ServiceManager);

        this.initializeService = {};
    }

    _createClass(ServiceManager, [{
        key: 'getService',
        value: function getService(serviceId) {
            if (!_.find(this.initializedServices, serviceId)) {
                return initializeService(serviceId);
            }

            return this.initializedServices[serviceId];
        }
    }, {
        key: 'initializeService',
        value: function initializeService(serviceId) {
            var _this = this;

            var service = new Service(serviceId);

            service.then(function (srv) {
                _this.initializedServices[serviceId] = srv;

                return srv;
            });
        }
    }]);

    return ServiceManager;
}();

var AccountManager = function () {
    function AccountManager() {
        _classCallCheck(this, AccountManager);

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
                ivr: {
                    id001: {
                        serviceName: 'uckg',
                        priority: 5,
                        actions: {
                            say: true,
                            record: true
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
                }
            }
        };
    }

    _createClass(AccountManager, [{
        key: 'getAccountData',
        value: function getAccountData(userId) {
            if (!_.find(this.userData, userId)) {
                return null;
            }

            return this.userData[userId];
        }
    }]);

    return AccountManager;
}();

var accountManager = new AccountManager();

var Service = function () {
    function Service(serviceId) {
        var _this2 = this;

        _classCallCheck(this, Service);

        return accountManager.getAccountData(serviceId).then(function (accountData) {
            var accountName = accountData.accountName,
                ivr = accountData.ivr,
                agents = accountData.agents,
                languages = accountData.languages;

            _this2.accountName = accountName;
            _this2.ivr = ivr;
            _this2.agents = agents;
            _this2.acceptedLanguages = [].concat(_toConsumableArray(languages));
            _this2.currentSessions = [];
            _this2.languageAction = {
                say: 'To Continue in english, press 1. Kuendelea kwa kiswahili bonyeza mbili',
                languageOptions: ['english', 'swahili'],
                actionHandler: _this2.ivr
            };
        });
    }

    _createClass(Service, [{
        key: 'getSession',
        value: function getSession(sessionId) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            if (!_.find(this.currentSessions, sessionId)) {
                return this.initializeSession(sessionId, options);
            }

            return this.currentSessions[sessionId];
        }
    }, {
        key: 'initializeSession',
        value: function initializeSession(sessionId, options) {
            var callerPhone = options.callerPhone || null;

            if (!callerPhone) {
                return null;
            }

            var newSession = _.merge({}, {
                callerPhone: callerPhone,
                language: options.language || null,
                currentHandler: this.languageAction,
                userHistory: {}
            });

            this.currentSessions[sessionId] = newSession;

            return newSession;
        }
    }, {
        key: 'getNextHandler',
        value: function getNextHandler(sessId, option) {
            if (!_.find(this.sessions, sessId)) {
                return null;
            }

            if (!option) {
                return null;
            }

            var session = this.sessions[sessId];

            if (!this.hasOptions(session) && this.getChildren(session).length > option) {
                return null;
            }

            /**Language configuration object */
            if (session === this.languageAction) {
                if (session.languageOptions.length > options) {
                    return null;
                }

                var language = session.languageOptions[option];

                this.configureLanguageForSession(sessId, language);
                this.updateHandler(session.actionHandler);

                return session.actionHandler;
            }

            // Normal handler 
            var handlerKey = Object.keys(session.children)[option];

            if (!handlerKey) {
                return null;
            }

            return session.children[option];
        }
    }, {
        key: 'hasOptions',
        value: function hasOptions(session) {
            // Check if a session handler has keys 
            return session.currentHandler.children !== null;
        }
    }, {
        key: 'getChildren',
        value: function getChildren(session) {
            // Get all children actions on the current session handler 
            var children = session.currentHandler.children;


            if (!children) {
                return [];
            }

            return Object.keys(children);
        }
    }, {
        key: 'configureLanguageForSession',
        value: function configureLanguageForSession(sessId, language) {
            if (!_.find(this.sessions, sessId)) {
                return null;
            }

            var session = this.sessions[sessId];
            session.language = language;
        }
    }, {
        key: 'handleIncomingRequest',
        value: function handleIncomingRequest(payload) {
            var sessionId = payload.sessionId,
                dmtfDigits = payload.dmtfDigits;


            var nextHandler = this.getNextHandler(sessionId, dmtfDigits);

            var response = formatResponse(nextHandler);
            this.updateHandler(sessionId, nextHandler);

            return response;
        }
    }, {
        key: 'updateHandler',
        value: function updateHandler(sessionId, nextHandler) {
            var session = this.getSession(sessionId);

            session.currentHandler = nextHandler;
        }
    }, {
        key: 'formatResponse',
        value: function formatResponse(response) {
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
    }]);

    return Service;
}();

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

var serviceManager = new ServiceManager();

module.exports = serviceManager;
