'use strict';

const Agent = require('node-agent-sdk').Agent;
var fortune = require('./fortunes.json');


const agent = new Agent({
    accountId: "56566693",
    username: "x",
    password: "x"
    });

let myConfig = {
    intervals : 200
}
const test = {
    "type": "vertical",
    "elements": [
        {
            "type": "button",
            "tooltip": "button tooltip",
            "title": "Leo",
            "click": {
                "actions": [
                    {
                        "type": "publishText",
                        "text": "Leo"
                    }
                ]
            }
        },
        {
            "type": "button",
            "tooltip": "button tooltip",
            "title": "Virgin",
            "click": {
                "actions": [
                    {
                        "type": "publishText",
                        "text": "Virgin"
                    }
                ]
            }
        }
    ]
}

let openConvs = {};
//agent._init()
agent.on('connected', () => {
    console.log('connected...');
    agent.setAgentState({ availability: 'AWAY' }); // Do not route me conversations, I'll join by myself.
    agent.subscribeExConversations({
        'convState': ['OPEN'] // subscribes to all open conversation in the account.
    });
    this._pingClock = setInterval(() => {
        getClock(agent)
    }, myConfig.intervals * 1000);

   
});

agent.on('cqm.ExConversationChangeNotification', notificationBody => {
    notificationBody.changes.forEach(change => {
        if (change.type === 'UPSERT') {
            if (!openConvs[change.result.convId]) {
                openConvs[change.result.convId] = change.result;
                agent.subscribeMessagingEvents({dialogId: change.result.convId}, e => {if (e) console.error(e)})
                if (!getParticipantInfo(change.result.conversationDetails, agent.agentId)) {
                    agent.updateConversationField({
                        'conversationId': change.result.convId,
                        'conversationField': [{
                            'field': 'ParticipantsChange',
                            'type': 'ADD',
                            'role': 'ASSIGNED_AGENT'
                        }]
                    }, 
                    
                    // () => {
                    //     agent.publishEvent({
                    //         dialogId: change.result.convId,
                    //         event: {
                    //             type: 'ContentEvent',
                    //             contentType: 'text/plain',
                    //             message: 'SASA test'
                    //         }
                    //     });
                    // });

                    () => {
                       // sendSC(change.result.convId,pcs.login);
                      //  testText(change.result.convId,"TESTING LOL1")
                      sendingSC(change.result.convId,fortune);
                    //   agent.publishEvent({
                    //     dialogId: change.result.convId,
                    //     event: {
                    //         type: 'RichContentEvent',
                    //         content: fortune
                    //     }
                         
                    //     }, (e, r) => {
                    //         if (e) {
                    //             console.log(`sendRichContent card ${change.result.convId} ${JSON.stringify(e)} ${JSON.stringify(test)}`)
                    //         } else {
                    //             console.log(`sendRichContent successful: ${JSON.stringify(r)}`)
                  //        }
                      //  }
                   // );
    
                    
                    });

       


                }
            }
        }
        else if (change.type === 'DELETE') {
            delete openConvs[change.result.convId];
            console.log('conversation was closed.\n');
        }
    });
});

agent.on('error', err => {
    console.log('got an error', err);
});

agent.on('ms.MessagingEventNotification', body => {
    const respond = {};

body.changes.forEach(c => {
    // In the current version MessagingEventNotification are recived also without subscription
    // Will be fixed in the next api version. So we have to check if this notification is handled by us.
    if (openConvs[c.dialogId]) {
    // add to respond list all content event not by me
    if (c.event.type === 'ContentEvent' && c.originatorId !== agent.agentId) {
        respond[`${body.dialogId}-${c.sequence}`] = {
            dialogId: body.dialogId,
            sequence: c.sequence,
            message: c.event.message
        };
        let msg = c.event.message.toLowerCase();
if (msg == "leo"){
              
                        agent.publishEvent({
                            dialogId: body.dialogId,
                            event: {
                                type: 'ContentEvent',
                                contentType: 'text/plain',
                                message: 'You are the best Lion!'
                            }
                        }),(e,r) => {
                            if (e){
                                console.log(`ERROR ${e,r}`)
                            } else { console.log(`success ${r}`)}
                            ;
                   
}
      console.log("CONTENT " + JSON.stringify(respond) );

    }
    // remove from respond list all the messages that were already read
    if (c.event.type === 'AcceptStatusEvent' && c.originatorId === agent.agentId) {
        c.event.sequenceList.forEach(seq => {
            delete respond[`${body.dialogId}-${seq}`];
    });
    }
    }}
});

// publish read, and echo
Object.keys(respond).forEach(key => {
    var contentEvent = respond[key];
agent.publishEvent({
    dialogId: contentEvent.dialogId,
    event: {type: "AcceptStatusEvent", status: "READ", sequenceList: [contentEvent.sequence]}
});
agent.emit(agent.CONTENT_NOTIFICATION, contentEvent);
});
});

agent.on('closed', data => {
    // For production environments ensure that you implement reconnect logic according to
    // liveperson's retry policy guidelines: https://developers.liveperson.com/guides-retry-policy.html
    console.log('socket closed', data);
    clearInterval(agent._pingClock);
    agent.reconnect(); //regenerate token for reasons of authorization (data === 4401 || data === 4407)
});

const getClock = (context) => {
    let before = new Date();
    context.getClock({}, (e, resp) => {
        if (e) {console.log(`[bot.js] getClock: ${JSON.stringify(e)}`)}
        else {
            let after = new Date();
            console.log(`[bot.js] getClock: request took ${after.getTime()-before.getTime()}ms, diff = ${resp.currentTime - after}`);
        }
    });
};

function getParticipantInfo(convDetails, participantId) {
    return convDetails.participants.filter(p => p.id === participantId)[0];
}

function sendingSC(conversationID, content) {
     console.log("Sending SC");
    // session[conversationID]["typing"] = true;
    //    updateTyping(conversationID, true);
        agent.publishEvent({
            dialogId: conversationID,
            event: {
                type: 'RichContentEvent',
                content: content
                
                
        //        updateTyping(conversationID, false);
        // session[conversationID]["typing"] = false;

            }
          })
        }

        function testText(conversationID, myText) {
            console.log("Sending SC");
           // session[conversationID]["typing"] = true;
           //    updateTyping(conversationID, true);
                        agent.publishEvent({
                            dialogId: conversationID,
                            event: {
                                type: 'ContentEvent',
                                contentType: 'text/plain',
                                message: myText
                            }
                        });
                    }
