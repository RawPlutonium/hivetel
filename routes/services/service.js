const accountManager = require('./account-manager');
const _ = require('lodash');
const jsontoxml = require('jsontoxml');
const appContext = require('./app-context');

function Service(serviceId){
    return accountManager.getAccountData(serviceId)
        .then(accountData => {
            // console.log("Account data here ", accountData);
            const {accountName, languages, ivr, Agents, registeredNumbers} = accountData;

            console.log("Account data ",accountData);
            this.accountName = accountName;
            this.languages = [...languages];
            this.ivr = ivr;
            this.agents = [...Agents];
            this.currentSessions = [];
            this.registeredNumbers = registeredNumbers;
            console.log("Agents ", this.agents);
            return this;

        }).catch(err => console.log(err));
}

Service.prototype.getSession = function(sessionId, options){
    // const session = _.find(this.currentSessions, sessionId);
    const session = this.currentSessions[sessionId];

    if(!session){
        return this.initializeSession(sessionId, options);
    }

    return session;
}

/**
 * Initialize a new session to handle the session for a caller,
 * Caller data is passed in the options 
 */
Service.prototype.initializeSession = function(sessionId, options){
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
        const {dtmfDigits} = payload;
        
        if( !dtmfDigits ){
            console.log("First call");
            // Might be the first call 
            return this.formatResponse(handler, session);
        }
        if( dtmfDigits && dtmfDigits > this.languages.length ){
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
        const language = _.nth(this.languages, dtmfDigits - 1);


        this.configureLanguage(language, session);
        const nextHandler = this.getNextHandler(session.currentHandler, session, dtmfDigits);
        this.setHandler(session, nextHandler);
        return this.formatResponse(nextHandler, session);
    }
    

    // Normal configuration - fetch the appropriate handler for this session
    const dtmfDigits = payload.dtmfDigits;

    // const selectedService = this.getSelectedService(currentHandler, session, dtmfDigits);

    const nextHandler = this.getNextHandler(handler, session, dtmfDigits);

    this.setHandler(session, nextHandler);
    return this.formatResponse(nextHandler, session);
}

Service.prototype.configureLanguage = function(language, session){
    // Configure the language 
    console.log("Configuring language to ", language);
    if( language && session){
        session.language = language;
    }

    console.log("Done configuring language - session.language ", session.language);
}

Service.prototype.retryAction = function(session, config){
    const {status} = config;   //What to respond with the handler 
    let sess = _.clone(session);

    console.log("Selected language ", language);
    // Join it with the handler action say response and return it 
    let {currentHandler, language} = session;

    if( !language ){
        language = 'english';
    }
    // Get the appropriate response based on the session 
    let say = currentHandler.say;
    let content = say.content;
    let engReply = status.english + content.english;
    let swareply = status.swahili + content.swahili;


    say = {...say, english: engReply, swahili: swareply};

    currentHandler = {...currentHandler, say: {...say}};

    return this.formatResponse(currentHandler, session);
}

Service.prototype.setHandler = function(session, nextHandler){
    if( session && nextHandler){
        session.currentHandler = nextHandler;
    }
}

Service.prototype.getNextHandler = function(currentHandler, session, dtmfDigits){
    // Fetch the next handler for the given handler 
    if( !currentHandler ){
        return null;
    }

    // console.log("Getting next handler ", dtmfDigits);

    if( currentHandler.children && Array.isArray(currentHandler.children)){
        // is children a list 
        // if( !dtmfDigits ){
        //     return this.retryAction(session, {
        //         status: {
        //             english: "Sorry, you did not select any option, please retry",
        //             swahili: "Samahani, huja fanya chaguo lolote, tafadhali jaribu tena"
        //         }
        //     });
        // }
        // Iterate through all child actions and read out the say 
        if( dtmfDigits === '0'){
            // Get an agent to call 
            return this.getAgentHandler(session);
        } 
        const {language} = session;

        const childHandlers = currentHandler.children;
        let allResponses = [];

        for( let i = 0; i < childHandlers.length; ++i){
            let handler = childHandlers[i];
            // console.log("Handler for this ", handler);

            if( handler.actionType === "service" || handler.actionType === "redirect"){
                // const {say} = handler;
                const say = handler.say;
                const content = say.content;

                // console.log("Handler for this service content", content[language])

                allResponses.push(content[language]);
            }
        }

        // console.log("All responses ",allResponses);

        let respString = allResponses.join();
        // console.log("resp string ", respString);
        const replAction = {
            actionType: 'service',
            say: {
                content: {
                    english: respString
                }
            },
            voice: "woman",
            getDigits: true
        };

        return replAction;
    }else{
        // Get the appropriate agent to call and create an action handler to call the agent 
        return this.getAgentHandler(session);
    }
}

Service.prototype.getAgentHandler = function(session){
    // Get an appropriate agent handler for this session 
    let {language} = session;


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


    // const {services} = session.userHistory;
    // const services = session.userHistory;

    // const servicesArray = flattenServices(services);
    const selectedLanguage = session.language;
    const agents = this.agents;
    function filterAgents(agents){
        let filteredAgents = [];

        // const agents = this.agents;
        // console.log("Agent list ", this.agents);

        // Loop through and generate a list of selected agents to handle the call 
        for( let i = 0; i < agents.length ; ++i){
            // Process a single agent 
            const agent = agents[i];

            // console.log("Agent 1", agent);

            const {preferences: {languages}} = agent;

            if( !_.findIndex(languages, selectedLanguage)){
                continue;
            }

            // if( !_.find(services, _.head(servicesArray))){
            //     continue;
            // }

            // _.concat(filteredAgents, agent);
            filteredAgents.push(agent);
        }
        return filteredAgents;
    }
     // Create an action object to dial the actions 
    //  console.log("Agents ", agents);
     const callAgents = filterAgents(agents);

    //  let agentsPhones = callAgents.map(agent => agent.phoneNumber);
     let agentsPhones = [];
     for(let i = 0; i < callAgents.length; ++i){
         const agent = callAgents[i];
         
         const phone = agent.phoneNumber;

         agentsPhones.push(phone);
     }

     // Update the session with handler agents 
     const response = {
         say: {
             content: {
                 english: 'Please hold as we transfer your call to an active agent, thank you',
                 swahili: 'Tafadhali shikilia tunapo hamisha simu yako kwa wakala atakaye kushughulikia, asanti'
             },
             voice: 'woman',
             record: true
         },
         dial: {
             phoneNumbers: agentsPhones.join(),
             record: true,
             maxDuration: '5'
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

    // let {language} = session;
    let language = session.language;
    if( !language ){
        language = 'english'
    }

    const headers = appContext.getResponseHeaders();
    let actionList = [];

    // process the say action 
    const {say, dial} = response;
    if( say ){
        let {content, voice} = say;
        if( !voice ){
            voice = "woman"
        }

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
        // const {dial: {phoneNumbers, maxRetries}} = dial;
        const phoneNumbers = dial.phoneNumbers;
        const maxRetries = dial.maxRetries || 5;
        console.log("Dial this ", dial);

        actionList = [...actionList, {
            name: 'Dial',
            attrs: {
                phoneNumbers,
                maxRetries
            }
        }]
    }

    const getDigits = Boolean(response.children || response.getDigits );

    const processedResponse = getDigits ? {
        name: 'GetDigits',
        attrs: {
            finishOnKey: '#'
        },
        children: [ ...actionList]
    } :  [...actionList];

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

     return Object.keys(handler.children);
 }

module.exports = Service;