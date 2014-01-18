

function TrelloClient () {
  this.apiKey = null;
  this.apiSecret = null;
  this.clientToken = null;   // Required to see non public boards
  this.username = null;
}

// If the user is logged into Trello, we can get his API key and secret for him
// The callback takes an err argument
TrelloClient.prototype.getApiCredentials = function (cb) {
  var self = this
    , callback = cb || function() {};

  $.ajax({ url: "https://trello.com/1/appKey/generate" }).done(function (data) {
    try {
      var html = $($.parseHTML(data))
        , apiKey = html.find("input#key").val()
        , apiSecret = html.find("input#secret").val()
        ;
      if (!apiKey || !apiSecret) {
        return callback("Couldn't get API key and secret from the returned HTML");
      } else {
        self.apiKey = apiKey;
        self.apiSecret = apiSecret;
        return callback(null);
      }
    } catch (e) {
      return callback(e);
    }
  }).fail(function () {
    return callback("Unauthorized access");
  });
};

// Simulates the user requesting then accepting a client token for this application
// The callback takes only one err argument
TrelloClient.prototype.getClientToken = function(cb) {
  var self = this
    , callback = cb || function() {};


  if (!this.apiKey) { return callback("Can't request token without an API key"); }

  $.ajax({ url: "https://trello.com/1/authorize?key=" + self.apiKey + "&name=TrelloCapture&expiration=never&response_type=token" }).done(function(data) {
    try {
      var html = $($.parseHTML(data))
        , approve = "Allow"
        , requestKey = html.find("input[name='requestKey']").val()
        , signature = html.find("input[name='signature']").val()
        ;
    } catch(e) { return callback(e); }
    
    $.ajax({ type: 'POST'
    , url: 'https://trello.com/1/token/approve'
    , data: { approve: approve, requestKey: requestKey, signature: signature }
    }).done(function(data) {
      try {
        var html = $($.parseHTML(data))
          , token = $(html[5]).html().replace(/ /g, '').replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '')
          ;
      } catch (e) { return callback(e); }

      if (token && token.length === 64) {
        self.clientToken = token;
        return callback(null);
      } else {
        // Should probably loop on the html array to check whether its structure was changed
        return callback("Couldn't get valid token");
      }
    }).fail(function () {
      return callback("Trello refused to give a token");
    });
  }).fail(function () {
    return callback("Unauthorized access");
  });
};

// Simulates going to the frontpage and scrape the username
// If this.username is not populated, it means user is not logged in
// Callback takes one err argument
TrelloClient.prototype.getLoggedUsername = function (cb) {
  var self = this
    , callback = cb || function() {};

  
  $.ajax({ url: "https://trello.com/1/Members/me" }).done(function (data) {
    self.username = data.username;
    return callback(null);
  }).fail(function () {
    return callback("Unauthorized access");
  });
};


TrelloClient.prototype.getAllBoards = function (cb) {
  var self = this
    , callback = cb || function() {};  

  $.ajax({ url: "https://api.trello.com/1/members/" + this.username + "/boards?key=" + this.apiKey + "&token=" + this.clientToken }).done(function(data) {
    console.log(data);
  });


};


var tc = new TrelloClient();
tc.getApiCredentials(function() {
  tc.getClientToken(function () {
    tc.getLoggedUsername(function(err) {
      console.log("-----------------");
      console.log(err);
      console.log(tc);
      tc.getAllBoards();
    });
  });
});




// chrome.runtime.onMessage.addListener(
  // function(request, sender, sendResponse) {
    // console.log("--- RECEIVED MESSAGE");
    // console.log(request);
   
    // $('#screenshot').attr('src', request.imageData);
    

// });