/**
 * Main management interface
 */

var tc = new TrelloClient()
  , chosenLabels = {}
  , possibleLabels = ["red", "orange", "yellow", "purple", "blue", "green"]
  , $leftPane = $('#left-pane')
  ;


function populateBoardsList(cb) {
  var callback = cb || function() {};
  
  tc.getAllBoards(function(err) {
    var options = "";

    if (err) { return callback(err); }
    
    tc.openBoards.sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (board) {
      options += '<option value="' + board.id + '">' + board.name + '</option>';
    });
    
    $('#boardsList').html(options);
    
    // Use remembered value if there is one
    if (localStorage.currentBoardId) {
      $('#boardsList option[value="' + localStorage.currentBoardId + '"]').prop('selected', true);
    }
    
    return callback(null);
  });
}


function populateLabelNamesList(cb) {
  var callback = cb || function() {}
    , selectedBoardId = $('#boardsList option:selected').val()
    ;

  tc.getAllLabelsNames(selectedBoardId, function (err) {
    if (err) { return callback(err); }

    Object.keys(tc.currentLabels).forEach(function(color) {
      $('.label-pickers div.' + color).html(tc.currentLabels[color] + "&nbsp;");   // Small hack ...
    });
    
  });
}


function populateListsList(cb) {
  var callback = cb || function() {}
    , selectedBoardId = $('#boardsList option:selected').val()
    ;
    
  tc.getAllCurrentLists(selectedBoardId, function (err) {
    var options = "";

    if (err) { return callback(err); }
    
    tc.currentLists.sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (list) {
      options += '<option value="' + list.id + '">' + list.name + '</option>';
    });
    
    $('#listsList').html(options);
    
    // Use remembered value if there is one
    if (localStorage.currentListId) {
      $('#listsList option[value="' + localStorage.currentListId + '"]').prop('selected', true);
    }

    return callback(null);
  });
}


function getSelectedLabels() {
  var labels = [];
  $('.label-pickers div.selected').each(function(i, d){
    $(d).attr('class').split(' ').forEach(function (clazz) {
      if (clazz !== 'selected') { labels.push(clazz); }
    });
  })
  return labels;
}


// Takes as input an XMLHttpRequestProgressEvent e
function updateUploadProgress(e) {
  var progress = Math.floor(100 * (e.position / e.totalSize));

  $('#progress-bar').css('width', progress + '%');
  
  if (progress === 100) {
    setTimeout(function () {
      $('#cardWasCreated').css('display', 'block');
    }, 700);
  }
}


// Give feedback to user that card was created and close page
function cardWasCreated() {
  console.log("Card is created, closing window");
  window.close();
}


// Validation. Quite custom but not a real issue here ...

// Only validate text length. Wouldn't work if lower bound is greater than 1 of course but we're lucky here !
function validateText(inputId, lowerBound, upperBound) {
  return function() {
    var $input = $(inputId)
      , value = $input.val()
      , $parentDiv = $input.parent()
      , $errorMessage = $parentDiv.find('div.alert')
      ;
    
    if (value.length >= lowerBound && value.length <= upperBound) {
      $parentDiv.removeClass('has-error');
      $errorMessage.css('display', 'none');
      return true;
    } else {
      $parentDiv.addClass('has-error');  
      $errorMessage.css('display', 'block');
      return false;
    }  
  }
}

var validateCardName = validateText('#cardName', 1, 16384);
$('#cardName').on('keyup', validateCardName);

var validateCardDesc = validateText('#cardDesc', 0, 16384);
$('#cardDesc').on('keyup', validateCardDesc);



// =================================================
// Initialization
// =================================================

// Panes sizes and left pane behaviour, plus canvas
var totalHeight = $('body').height()
  , totalWidth = $('body').width()
  , topPaneHeight = 50
  , screenshotPaneHeight = totalHeight - topPaneHeight
  , rightPanesWidth = Math.floor(totalWidth * screenshotPaneHeight / totalHeight)
  , leftPaneWidth = Math.floor(0.2 * totalWidth)
  , baseLeftPanePosition = Math.max(totalWidth - rightPanesWidth - leftPaneWidth, 20 - leftPaneWidth)
  ;

$('#top-pane').css('width', rightPanesWidth + 'px');
$('#top-pane').css('height', topPaneHeight + 'px');

$('#screenshot-pane').css('width', rightPanesWidth + 'px');
$('#screenshot-pane').css('height', screenshotPaneHeight + 'px');

$leftPane.css('width', leftPaneWidth + 'px');
$leftPane.css('left', baseLeftPanePosition + 'px');

$leftPane.on('mouseover', function() {
  $leftPane.css('left', '0');
})

$leftPane.on('mouseout', function() {
  $leftPane.css('left', baseLeftPanePosition + 'px');
})

var ms = new ModifiedScreenshot();



possibleLabels.forEach(function(label) {
  $('.' + label).on("click", function () {
    $('.' + label).toggleClass('selected');
  });
});


$('#boardsList').on('change', function() {
  var selectedBoardId = $('#boardsList option:selected').val();

  localStorage.currentBoardId = selectedBoardId;   // Remember this setting, user probably wants the same board all the time
  populateListsList();
  populateLabelNamesList();
});

$('#listsList').on('change', function() {
  localStorage.currentListId = $('#listsList option:selected').val();   // Remember this setting, user probably wants the same list all the time
});

$('#createCard').on('click', function () {
  if (!ms.currentBase64Image) { return; }
  if (!validateCardName() || !validateCardDesc()) { return; }
  
  var selectedListId = $('#listsList option:selected').val();
  
  tc.createCardOnTopOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), getSelectedLabels(), function (err, cardId) {
    $('#progress-bar-container').css('display', 'block');
    ms.persistCurrentScreenshot();
    tc.attachBase64ImageToCard(cardId, ms.currentBase64Image, updateUploadProgress, cardWasCreated);
  });
});

// Initialization
function initializeBoardsAndLists() {
  populateBoardsList(function() {
    $('#boardsList').trigger('change');
  });
}



// ============================
// Entry point
// ============================

tc.getLoggedUsername(function (err) {
  if (tc.username) {
    getTrelloCredentialsAndInitialize();
  } else {
    $('#login').css('display', 'block');
  }
});

// Makes the assumption the user is logged in to Trello
function getTrelloCredentialsAndInitialize (cb) {
  var callback = cb || function () {};

  tc.getLoggedUsername(function (err) {
    tc.getApiCredentials(function (err) {
      tc.getClientToken(function (err) {
        initializeBoardsAndLists();
      });
    });
  });
}

function tryToLogIn() {
  $('#login div.alert-danger').css('display', 'none');
  tc.logUserIn($('#login-email').val(), $('#login-password').val(), function (err, loggedIn) {
    if (loggedIn) {
      $('#login').css('display', 'none');
      getTrelloCredentialsAndInitialize();
    } else {
      $('#login div.alert-danger').css('display', 'block');
    }
  });
}


$('#login-button').on('click', tryToLogIn);
$('#login-box').on('keypress', function(evt) {
  if (evt.keyCode === 13) { tryToLogIn(); }
});






// When we receive an image
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  ms.setAsBackground(request.imageData);
});
