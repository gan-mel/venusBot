'use strict';

const Agent = require('node-agent-sdk').Agent;
var fortune = require('./fortunes.json');
var learn = require('./learnMore.json');
var rp = require('request-promise');

const agent = new Agent({
    accountId: "56566693",
    username: "VenusBot",
    password: "Toptop11"
    });

let myConfig = {
    intervals : 200
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

                    () => {
                      sendingSC(change.result.convId,fortune);       
                    }
                
                );

       


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
        //console.log(JSON.stringify(openConvs)+ "  CONV")
    // add to respond list all content event not by me
    if (c.originatorMetadata.role === 'CONSUMER' && c.event.type === 'ContentEvent' && c.originatorId !== agent.agentId  ) {
        // console.log(c.originatorId + "  ORIGINATOR")
        // console.log(agent.agentId + "  AGENTID")

        respond[`${body.dialogId}-${c.sequence}`] = {
            dialogId: body.dialogId,
            sequence: c.sequence,
            message: c.event.message
        };
                let msg = c.event.message.toLowerCase();
              //  console.log(msg +  "  MSG IS")

               // console.log(`${msg} MESSAGEIS `)
                  if (msg == "leo" || msg == "virgo" || msg == "ariess" || msg == "taurus" || 
                  msg == "gemini" || msg == "cancer" || msg == "pisces" || msg == "aquarius" || 
                  msg == "libra" || msg == "scorpio" || msg == "sagittarius" || msg == "capricorn" ) {
                // console.log("GOT LEO")

                   textSend(body.dialogId,"Fetching your daily fortune...")
                   fetchHoroscopes(body.dialogId,msg);       
                   sendingSC(body.dialogId,learn);       
                   

            } else  if(msg == "transferring to a real astrologist"){
                    console.log("Trasnfer outsdie")
                    transferSkill(body.dialogId,"1144089632")  
                  } 
                   //else if (msg.length > 0 && ) {
                   // textSend(body.dialogId,"Sorry, I don't speak free text :'(");
                    //console.log("LONGER THAN 0 MSG")
              // }
                }
      // console.log("CONTENT " + JSON.stringify(respond) );

        
    // remove from respond list all the messages that were already read
    if (c.event.type === 'AcceptStatusEvent' && c.originatorId === agent.agentId) {
        c.event.sequenceList.forEach(seq => {
            delete respond[`${body.dialogId}-${seq}`];
         });
        
      }
    }
});

// publish read, and echo
Object.keys(respond).forEach(key => {
    var contentEvent = respond[key];
agent.publishEvent({
    dialogId: contentEvent.dialogId,
    event: {type: "AcceptStatusEvent", status: "READ", sequenceList: [contentEvent.sequence]}
        });
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
  //   console.log("Sending SC" +  openConvs[conversationID]);
   //   openConvs[conversationID]["typing"] = true;
       // updateTyping(conversationID, true);
       setTimeout( () => agent.publishEvent({
            dialogId: conversationID,
            event: {
                type: 'RichContentEvent',
                content: content
                
                
        //        updateTyping(conversationID, false);
        // session[conversationID]["typing"] = false;

            }
          }),3000)
        }

       function textSend(conversationID, myText) {
            console.log("Sending Text");
           // session[conversationID]["typing"] = true;
           //    updateTyping(conversationID, true);
                        agent.publishEvent({
                            dialogId: conversationID,
                            event: {
                                type: 'ContentEvent',
                                contentType: 'text/plain',
                                message: myText
                            }
                        }),(e,r) => {
                            if (e){
                                console.log(`ERROR ${e,r}`)
                            } else { console.log(`success ${r}`)}
                            ;;
                    }
                } 

                   const fetchHoroscopes = (conversationID,sign) => {
                    var options = {
                        uri: `http://horoscope-api.herokuapp.com/horoscope/today/${sign}`,

                        headers: {
                            'User-Agent': 'Request-Promise'
                        },
                       json: true // Automatically parses the JSON string in the response
                    };
                    
                    rp(options)
                        .then((res) => {
                           // console.log('User has', res.horoscope);
                            textSend(conversationID,res.horoscope)
                        })
                        .catch( (err) => {
                            console.log(err+ " ERROR")
                        });
                    }

                    function transferSkill(conversationID, targetSkillId) {
                        console.log("Sending Text");
                       // session[conversationID]["typing"] = true;
                       //    updateTyping(conversationID, true);
                       agent.updateConversationField({
                        'conversationId': conversationID,
                            'conversationField': [
                                {
                                    'field': 'ParticipantsChange',
                                    'type': 'REMOVE',
                                    'role': 'ASSIGNED_AGENT'
                                },
                                {
                                    'field': 'Skill',
                                    'type': 'UPDATE',
                                    'skill': targetSkillId
                                }
                            ]
                        }, (e, resp) => {
                            if (e) { console.error(e) }
                            console.log(resp)
                        });
                            } 

