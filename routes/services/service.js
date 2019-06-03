const accountManager = require('./account-manager');
const _ = require('lodash');
const jsontoxml = require('jsontoxml');
const appContext = require('./app-context');

function Service(serviceId){
    return accountManager.getAccountData(serviceId)
        .then(accountData => {
            console.log("Account data here ", accountData);
            const {accountName, languages, ivr, agents, registeredNumbers} = accountData;


            this.accountName = accountName;
            this.languages = [...languages];
            this.ivr = ivr;
            this.agents = agents;
            this.currentSessions = [];
            this.registeredNumbers = registeredNumbers;

            return this;

        }).catch(err => console.log(err));
}

Service.prototype.getSession = function(sessionId, options){
    const session = _.find(this.currentSessions, sessionId);

    if(!session){
        console.log("Options will be here ", options);
        return this.initializeSession(sessionId, options);
    }

    return session;
}

/**
 * Initialize a new session to handle the session for a caller,
 * Caller data is passed in the options 
 */
Service.prototype.initializeSession = function(sessionId, options){
    console.log("Options file ", options);
    const {callerNumber} = options;
    if(! callerNumber){
        return null;
    }

    const session = {
        callerNumber,
        currentHandler: this.ivr,
        timestamp: new Date(),
        serviceSelections: {},
        language: null
    }

    this.currentSessions[sessionId] = session;

    return session;
}

/**
 * Process an incoming request
 */
Service.prototype.handleIncomingRequest = function(payload){
    const {sessionId} = payload;


    if( !sessionId ){
        // Invalid request 
        return { status: 'Invalid Request'}
    }


    const session = this.getSession(sessionId, payload);

    const handler = session.currentHandler;

    // Language configuration

    if( !session.language && handler.actionType === 'language'){
        // Configure language 
        const {dmtfDigits} = payload;

        if( !dmtfDigits || dmtfDigits > this.languages.length || isNaN(dmtfDigits)){
            // Pressed the wrong option - try and retry the action with the status
            // the selection you have selected is not valid. Please try again - retry
            return this.retryAction(session, {
                status: {
                    english: 'the selection you have selected is not valid. Please try again',
                    swahili: 'chaguo ulilofanya hali tambuliki. tafadhali rudia tena'
                }
            });
        }

        // Get the language selected 
        const language = _.nth(this.languages, dmtfDigits);

        this.configureLanguage(language);
        const nextHandler = this.getNextHandler(session);
        this.setHandler(sessionId,nextHandler);

        return this.formatResponse(nextHandler, session);
    }
    

    // Normal configuration - fetch the appropriate handler for this session
    const {currentHandler} = session;

    const nextHandler = this.getNextHandler(currentHandler, session);

    this.setHandler(session, nextHandler);
    return this.formatResponse(nextHandler, session);
}

Service.prototype.retryAction = function(session, config){
    const {status} = config;   //What to respond with the handler 
    let sess = _.clone(session);

    // Join it with the handler action say response and return it 
    let {currentHandler, language} = sess;

    if( !language ){
        language = 'english';
    }
    // Get the appropriate response based on the session 
    let {say} = currentHandler;
    let {content} = say;
    let engReply = status.english + content.english;
    let swareply = status.swahili + content.swahili;

    console.log("Current handler retry ", currentHandler);

    say = {...say, english: engReply, swahili: swareply};

    currentHandler = {...currentHandler, say: {...say}};

    return this.formatResponse(currentHandler, session);
}

Service.prototype.setHandler = function(session, nextHandler){
    if( session && nextHandler){
        session.currentHandler = nextHandler;
    }
}

Service.prototype.getNextHandler = function(currentHandler, session, dmtfDigits){
    // Fetch the next handler for the given handler 
    if( !currentHandler ){
        return null;
    }

    if( currentHandler.children && Array.isArray(currentHandler.children)){
        // is children a list 
        if( !dmtfDigits ){
            return this.retryAction(currentHandler, {
                status: {
                    english: "Sorry, you did not select any option, please retry",
                    swahili: "Samahani, huja fanya chaguo lolote, tafadhali jaribu tena"
                }
            });
        }
        return _.nth(currentHandler.children, dmtfDigits);
    }else{
        // Get the appropriate agent to call and create an action handler to call the agent 
        return this.getAgentHandler(session);
    }
}

Service.prototype.getAgentHandler = function(session){
    // Get an appropriate agent handler for this session 
    let {language, userHistory} = session;

    if( !language ){
        // Fallback to both english and swahili 
        language = ['english', 'swahili']
    }

    function flattenServices(services){
        let servicesArr = [];

        let sObj = _.clone(services);
        do{
            const {serviceId} = sObj;

            _.concat(servicesArr, serviceId);
            sObj = sObj.children;
        }while(sObj.children !== undefined);

        return servicesArr;
    }

    // Flatten the services in user history
    const {services} = session.userHistory;
    const servicesArray = flattenServices(services);
    const selectedLanguage = services.language;

    function filterAgents(){
        let filteredAgents = [];

        const agents = this.agents;

        // Loop through and generate a list of selected agents to handle the call 
        for( let i = 0; i < agents.length ; ++i){
            // Process a single agent 
            const agent = agents[i];

            const {preferences: {languages, services}} = agent;

            if( !_.findIndex(languages, selectedLanguage)){
                continue;
            }

            if( !_.find(services, _.head(servicesArray))){
                continue;
            }

            _.concat(filteredAgents, agent);
        }
        return filteredAgents;
    }
     // Create an action object to dial the actions 
     const callAgents = filterAgents();

     let agentsPhones = callAgents.map(agent => agent.phoneNumber);

     // Update the session with handler agents 
     const response = {
         say: {
             content: {
                 english: 'Please hold as we transfer your call to an active agent, thank you',
                 swahili: 'Tafadhali shikilia tunapo hamisha simu yako kwa wakala atakaye kushughulikia, asanti'
             },
             voice: 'female'
         },
         dial: {
             phoneNumbers: agentsPhones.join(),
             record: true,
             maxDuration: 5
         }
     }

     return response;

}


/**
 * Format response for AT and return
 * @param {object} action 
 */
Service.prototype.formatResponse = function(response, session){
    // Strip the action off the children

    /**
     * read the action object
     */

    // Is there a say object 
    let res = {};

    let {language} = session;
    if( !language ){
        language = 'english'
    }

    const headers = appContext.getResponseHeaders();
    let actionList = [];

    // process the say action 
    const {say, dial} = response;
    if( say ){
        const {content, voice} = say;

        // const text = _.find(content, language);
        const text = content[language];

        actionList = [...actionList, {
            name: 'Say',
            text,
            attrs: {voice}
        }];
    }
    

    // Process the dial 
    if( dial ){
        const {dial: {phoneNumbers, maxRetries}} = dial;

        actionList = [...actionList, {
            name: 'Dial',
            attrs: {
                phoneNumbers,
                maxRetries
            }
        }]
    }

    const getDigits = Boolean(response.children);

    const processedResponse = getDigits ? {
        name: 'GetDigits',
        attrs: {
            finishOnKey: '#'
        },
        children: [...actionList]
    } : [...actionList];

    res = {
        Response: [
            processedResponse
        ]
    }
    


    let xmlResponse = jsontoxml(res);

    return {headers, response: xmlResponse, status: "OK"};
}

/**
 * Determine is handler has child handler 
 * @param {object} handler - Handler object
 */
function hasChildren(handler){
    if( !handler ){
        return false;
    }

    return handler.children;
}

/**
 * Extract children handler from a handler
 */

 function children(handler){
     if( !handler ){
         return null;
     }

     return Object.keys(handler.childre);
 }

module.exports = Service;