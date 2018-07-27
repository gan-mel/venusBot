
const Agent = require('node-agent-sdk').Agent;



const agent = new Agent({
accountId: "81312216",
username: "x",
password: "x"
});



this.myConversations = {};



agent.on('connected', () => {
console.log(`connected...`);

agent.setAgentState({
'availability': 'ONLINE'
}, (e, resp) => {
if (e) { console.error(e) }
console.log(resp)
});
// subscribe to all conversations in the account
agent.subscribeExConversations({
'convState': ['OPEN']
// ,'agentIds': [agent.agentId] // remove this line to subscribe to all conversations instead of just the bot's conversations
}, (e, resp) => {
if (e) { console.error(e) }
console.log("subscribeExConversations " + resp)
});
agent.subscribeAgentsState({}, (e, resp) => {
if (e) { console.error("Agent state changed error: " + e) }
console.log("Agent state changed " + resp)
});

agent.subscribeRoutingTasks({}, (e, resp) => {
if (e) { console.error(e) }
console.log("subscribeRoutingTasks "+resp)
});
});

// log all conversation updates
agent.on('cqm.ExConversationChangeNotification', body => {
    body.changes.forEach(change => {
        if (change.type === 'UPSERT' && !inMyConversationList(change.result.convId)) {
            addToMyConversationList(change.result.convId);
            agent.subscribeMessagingEvents({dialogId: change.result.convId}, e => {if (e) console.error(e)})
        } else if (change.type === 'DELETE') {
            delete this.myConversations(change.result.convId);
        }
    })
});


inMyConversationList (conversationId) {
    return this.myConversations[conversationId];
};

_addToMyConversations (conversationId) {
    this.myConversations[conversationId] = {};
};



agent.getClock({}, (e, resp) => {
if (e) { console.error(e) }
console.log(resp)
});
