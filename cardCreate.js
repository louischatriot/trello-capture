

function TrelloClient () {
  this.apiKey = null;
  this.apiSecret = null;
  this.clientToken = null;   // Required to see non public boards
  this.username = null;
  
  this.apiKey = window.creds.apiKey;
  this.apiSecret = window.creds.apiSecret;
  this.clientToken = window.creds.clientToken;
  this.username = window.creds.username;
  
  this.openBoards = [];
  this.currentLists = [];
  this.currentCards = [];
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

  // TODO: check the scope is right
  $.ajax({ url: "https://trello.com/1/authorize?key=" + self.apiKey + "&name=TrelloCapture&expiration=never&response_type=token&scope=read,write" }).done(function(data) {
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
    self.openBoards = _.filter(data, function(board) { return board.closed === false; });
    return callback(null);
  }).fail(function() {
    return callback("Unauthorized access");
  });
};


TrelloClient.prototype.getAllCurrentLists = function (boardId, cb) {
  var self = this
    , callback = cb || function() {};
    
  $.ajax({ url: "https://api.trello.com/1/boards/" + boardId + "/lists?key=" + this.apiKey + "&token=" + this.clientToken }).done(function(data) {
    self.currentLists = _.filter(data, function (list) { return list.closed === false; });
    return callback(null);
  }).fail(function() {
    return callback("Unauthorized access");
  });
};


TrelloClient.prototype.getAllCurrentCards = function (listId, cb) {
  var self = this
    , callback = cb || function() {};
    
  $.ajax({ url: "https://api.trello.com/1/lists/" + listId + "/cards?key=" + this.apiKey + "&token=" + this.clientToken }).done(function(data) {
    self.currentCards = _.filter(data, function (card) { return card.closed === false; });
    return callback(null);
  }).fail(function() {
    return callback("Unauthorized access");
  });
};

var tc = new TrelloClient();
// tc.getApiCredentials(function() {
  // tc.getClientToken(function () {
    // tc.getLoggedUsername(function(err) {

    // });
  // });
// });

// console.log("-----------------");
// console.log(tc);
// tc.getAllBoards(function () {
  // var persoBoard = _.find(tc.openBoards, function(board) { return board.name === "Perso" });
  
  // console.log(persoBoard);
  
  // tc.getAllCurrentLists(persoBoard.id, function () {
    // var doingList = _.find(tc.currentLists, function (list) { return list.name === "Doing" });
    
    // console.log(doingList);
    
    // tc.getAllCurrentCards(doingList.id, function () {
      // var card = _.find(tc.currentCards, function (card) { return card.name === "Test" });
    
      // console.log(card);
    
      // $.ajax({ type: 'POST'
      // , url: ""
      // , data: {}
      // }).done(function(data) {
        // console.log("----- SUCCESS");
        // console.log(data);
      // }).fail(function(err) {
        // console.log("----- FAIL");
        // console.log(err);
      // });
    
    
    // });
  // });
// });



chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("--- RECEIVED MESSAGE");
    console.log(request);
   
    $('#screenshot').attr('src', request.imageData);
    
    // $('#uploadForm');
    
    
    var imgData = request.imageData.substring(23);
    window.imgData = imgData;
    
    
    var byteString = atob(imgData);
    
    var length = byteString.length;
    var ab = new ArrayBuffer(length);
    var ua = new Uint8Array(ab);
    for (var i = 0; i < length; i++) {
        ua[i] = byteString.charCodeAt(i);
    }
    
    // var builder = new BlobBuilder();
    // builder.append(ab);
    // var blob = builder.getBlob("image/jpeg");
    
    var blob = new Blob([ab], { type: "image/jpeg" });    
    window.$b = blob;
    
    var formData = new FormData();
    formData.append("key", "24257e0901edabbc2c28518cff71b9c8");
    formData.append("token", "d1a6496ac11d257c7fb0d1d59639a65b29cbe98bcc4d72c50b1d74e3f835196c");
    formData.append("file", blob, "helloworld.jpg");
    
    var req = new XMLHttpRequest();
    req.open("POST", "https://api.trello.com/1/cards/52d2fcf9aaa82dcb061b2e36/attachments");
    req.send(formData);
    
    // $('#uploadScreenshot').attr("files", [request.imageData]);
    
    
      // POSTING IMAGE TO TRELLO
      // var tc = new TrelloClient();
      // console.log("-----------------");
      // console.log(tc);
      // tc.getAllBoards(function () {
        // var persoBoard = _.find(tc.openBoards, function(board) { return board.name === "Perso" });
        
        // console.log(persoBoard);
        
        // tc.getAllCurrentLists(persoBoard.id, function () {
          // var doingList = _.find(tc.currentLists, function (list) { return list.name === "Doing" });
          
          // console.log(doingList);
          
          // tc.getAllCurrentCards(doingList.id, function () {
            // var card = _.find(tc.currentCards, function (card) { return card.name === "Test" });
          
            // console.log(card);
          
            // $.ajax({ type: 'POST'
            // , url: "https://api.trello.com/1/cards/" + card.id + "/attachments?key=" + tc.apiKey + "&token=" + tc.clientToken
            // , data: { file: request.imageData
                    // , enctype: "multipart/form-data"
                    // , mimeType: "image/jpeg"
                    // , url: null
                    // }
            // }).done(function(data) {
              // console.log("----- SUCCESS");
              // console.log(data);
            // }).fail(function(err) {
              // console.log("----- FAIL");
              // console.log(err);
            // });
          
          
          // });
        // });
      // });
    
    

});