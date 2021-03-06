"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function(defaultFuncs, api, ctx) {
  return function getThreadInfo(threadID, callback) {
    if(!callback) callback = function() {};

    var form = {
      'client' : 'mercury'
    };

    api.getUserInfo(threadID, function(err, userRes) {
      if(err) {
        return callback(err);
      }
      var key = (Object.keys(userRes).length > 0) ? "user_ids" : "thread_fbids";
      form['threads['+key+'][0]'] = threadID;

      if(ctx.globalOptions.pageId) form.request_user_id = ctx.globalOptions.pageId;

      defaultFuncs.post("https://www.facebook.com/ajax/mercury/thread_info.php", ctx.jar, form)
        .then(utils.parseAndCheckLogin(ctx.jar, defaultFuncs))
        .then(function(resData) {
          if (resData.error) {
            throw resData;
          } else if (!resData.payload){
            throw {error: "Could not retrieve thread Info."};
          }

          var threadData = resData.payload.threads[0];
          var userData = userRes[threadID];
          var info = {
            participantIDs: threadData.participants.map(id => id.split(':').pop()),
            name: threadData.name != null ? threadData.name : userData.name,
            snippet: threadData.snippet,
            messageCount: threadData.message_count,
            emoji: threadData.custom_like_icon,
            nicknames: threadData.custom_nickname,
            color: threadData.customColor,
          };
          callback(null, info);

        }).catch(function(err) {
          log.error("Error in getThreadInfo", err);
          return callback(err);
        });
    });

  };
};
