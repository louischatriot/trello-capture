/**
 * Main management interface
 */

var tc = new TrelloClient()
  , chosenLabels = {}
  , possibleLabels = ["red", "orange", "yellow", "purple", "blue", "green"]
  , $leftPane = $('#left-pane')
  , $topPane = $('#top-pane')
  ;


// Change a color's opacity, given that _oldColor is passed as rgb() or rgba() as is the case in jQuery
function changeOpacity(_oldColor, opacity) {
  var oldColor = _oldColor.split(',')
    , newColor = 'rgba(';
    
  newColor += oldColor[0].split('(')[1] + ',' + oldColor[1] + ',' + oldColor[2].split(')')[0] + ',' + (opacity || 1) + ')';  
  return newColor;
}
  
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
  var progress = Math.floor(100 * (e.loaded / e.total));

  $('#progress-bar').css('width', progress + '%');
  
  if (progress === 100) {
    setTimeout(function () {
      $('#cardWasCreated').css('display', 'block');
    }, 1000);
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

$topPane.css('width', rightPanesWidth + 'px');
$topPane.css('height', topPaneHeight + 'px');
$topPane.css('line-height', topPaneHeight + 'px');   // Vertically center contents on a single line
$topPane.css('padding-left', (30 + leftPaneWidth - totalWidth + rightPanesWidth) + 'px');   // 30px from border of left pane when it's totally on screen

$('#screenshot-pane').css('width', rightPanesWidth + 'px');
$('#screenshot-pane').css('height', screenshotPaneHeight + 'px');

// Show left pane until screenshot appears, then slide it to the left
$leftPane.css('width', leftPaneWidth + 'px');
$('body').on('trelloCapture.screenshotTaken', function () {
  $leftPane.css('left', baseLeftPanePosition + 'px');
});

$leftPane.on('mouseover', function() {
  $leftPane.css('left', '0');
})

$leftPane.on('mouseout', function() {
  $leftPane.css('left', baseLeftPanePosition + 'px');
})


// Drawing board
var ms = new ModifiedScreenshot();
ms.initColorPicker();
ms.initShapePicker();
// ms.initializeDrawingMode();   // TODO: remove, for testing only

$('#clear-board').on('click', function () {
  ms.clearAllDrawings();
});



window.ms = ms;   // TODO: remove, for testing only


// Manage background-color behavior on click for labels
possibleLabels.forEach(function(label) {
  var $label = $('.' + label);
  
  // Initial state
  $label.css('background-color', changeOpacity($label.css('background-color'), 0.35));

  $label.on("click", function () {
    $label.toggleClass('selected');
    if ($label.hasClass('selected')) {
      $label.css('background-color', changeOpacity($label.css('background-color'), 1));
    } else {
      $label.css('background-color', changeOpacity($label.css('background-color'), 0.35));    
    }
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

$('#on-top').on('change', function () {
  localStorage.cardOnTop = $('#on-top').prop('checked');
});

$('#createCard').on('click', function () {
  if (!ms.currentBase64Image) { return; }
  if (!validateCardName() || !validateCardDesc()) { return; }
  
  var selectedListId = $('#listsList option:selected').val();
  
  // Create card
  tc.createCardAtBottomOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), getSelectedLabels(), function (err, cardId) {
    async.waterfall([
      function (cb) {
        if ($('#on-top').prop('checked')) {
          tc.putCardOnTopOfList(cardId, cb);
        } else {
          return cb();
        }      
      }
    ], function () {
      $('#progress-bar-container').css('display', 'block');
      ms.persistCurrentScreenshot(function () {
        tc.attachBase64ImageToCard(cardId, ms.currentBase64Image, updateUploadProgress, cardWasCreated);
      });
    });
  });
});

// Initialization
function initializeBoardsAndLists() {
  populateBoardsList(function() {
    $('#boardsList').trigger('change');
  });
}

if (localStorage.cardOnTop) {
  $('#on-top').prop('checked', true);
}



// ============================
// Entry point
// ============================

tc.getLoggedUsername(function (err) {
  if (tc.username) {
    getTrelloCredentialsAndInitialize();
  } else {
    $('#login').css('display', 'block');   // TODO: uncomment
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
