import _ from 'lodash';

class Manager{
    sessions = {
        '1230923nksfdssad23': {
            callerPhone: '+254745231903',
            vPnum: '0900620000',
            currentHandler: new Handler(),
            clientAccount: '3240923jsd',
            history: {
                language: 'english'
            }
        }
    }
    constructor(vPnum){
        this.vPnum = vPnum;
    }

    getHandlerForSession = (sessionId, config) => {
        if(!_.find(this.sessions, sessionId)){
            return this.createNewSession(sessionId, config);
        }

        return _.find(this.sessions, sessionId);
    }
}

class SessionManger {
    managers = {
        0900620000: {
            manager: new Manager(0900620000)
        }
    };

    getManagerForVirtualPhone(vPnum){
        if(!_.find(this.managers, vPnum)){
            const manager = new Manager(vPnum);

            this.addManager(vPnum, manager);
        }

        return this.managers[vPnum];
    }

    addManager = (vPnum, manager) => {
        _.merge(this.managers, {vPnum: manager});
    }

    getAllManagers(){
        return this.managers;
    }
}

const sessionManager = new SessionManger();

export default sessionManager;