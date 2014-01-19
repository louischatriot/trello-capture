

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


TrelloClient.prototype.populateBoardsList = function (cb) {
  var self = this
    , callback = cb || function() {};  

  this.getAllBoards(function(err) {
    var options = "";

    if (err) { return callback(err); }
    
    self.openBoards.sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (board) {
      options += '<option value="' + board.id + '">' + board.name + '</option>';
    });
    
    $('#boardsList').html(options);
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


TrelloClient.prototype.populateListsList = function (cb) {
  var self = this
    , callback = cb || function() {}
    , selectedBoardId = $('#boardsList option:selected').val()
    ;
    
  this.getAllCurrentLists(selectedBoardId, function (err) {
    var options = "";

    if (err) { return callback(err); }
    
    self.currentLists.sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (list) {
      options += '<option value="' + list.id + '">' + list.name + '</option>';
    });
    
    $('#listsList').html(options);  
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


// Callback signature: err, createdCardId
TrelloClient.prototype.createCardOnTopOfCurrentList = function (listId, cardName, cardDesc, cb) {
  var self = this
    , callback = cb || function() {};

  $.ajax({ url: "https://api.trello.com/1/lists/" + listId + "/cards?key=" + this.apiKey + "&token=" + this.clientToken
         , type: 'POST'
         , data: { name: cardName, desc: cardDesc }
         }).done(function(data) {
    return callback(null, data.id);
  }).fail(function() {
    return callback("Unauthorized access");
  });
};


// ======================================================
// var tc = new TrelloClient();

// tc.populateBoardsList();

// $('#boardsList').on('change', function() {
  // tc.populateListsList();
// });

// $('#createCard').on('click', function () {
  // var selectedListId = $('#listsList option:selected').val()

  // console.log('----');
  // console.log(selectedListId);
  // tc.createCardOnTopOfCurrentList(selectedListId, function () {
  
  // });
// });


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


// Take as input a base64-encoded image (for example given by the tabs API screenshot)
// And send attach it to a Trello card
TrelloClient.prototype.attachBase64ImageToCard = function(cardId, imageData) {
  var imageDataElements = imageData.split(',')
    , mimeType = imageDataElements[0].split(':')[1].split(';')[0]
    , imageB64Data = imageDataElements[1]
    , byteString = atob(imageB64Data)
    , length = byteString.length
    , ab = new ArrayBuffer(length)
    , ua = new Uint8Array(ab)
    , blob, formData, request, i
    ;
    
  for (i = 0; i < length; i++) {
      ua[i] = byteString.charCodeAt(i);
  }
  
  blob = new Blob([ab], { type: mimeType });
  formData = new FormData();
  formData.append("key", this.apiKey);
  formData.append("token", this.clientToken);
  formData.append("file", blob, "screenshot.jpg");    // TODO slugify title or beginning of title
  
  request = new XMLHttpRequest();
  request.open("POST", "https://api.trello.com/1/cards/" + cardId + "/attachments");
  request.send(formData);
}





chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("--- RECEIVED MESSAGE");
    console.log(request);
   
   
    $('#screenshot-pane').css('background-image', 'url(' + request.imageData + ')');
   
    $('#screenshot-pane img').attr('src', request.imageData);

    // =========================
    var tc = new TrelloClient();

    tc.populateBoardsList();

    $('#boardsList').on('change', function() {
      tc.populateListsList();
    });

    $('#createCard').on('click', function () {
      var selectedListId = $('#listsList option:selected').val()

      console.log('----');
      console.log(selectedListId);
      tc.createCardOnTopOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), function (err, cardId) {
        tc.attachBase64ImageToCard(cardId, request.imageData);
      });
    });
    // =========================
    
    // var tc = new TrelloClient();
    // tc.attachBase64ImageToCard("52d2fcf9aaa82dcb061b2e36", request.imageData);
});