/**
 * Main management interface
 */

var tc = new TrelloClient()
  , currentImage
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
    return callback(null);
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
    return callback(null);
  });
}


// Takes as input an XMLHttpRequestProgressEvent e
function updateUploadProgress(e) {
  $('#progress-bar').css('width', Math.floor(100 * (e.position / e.totalSize)) + '%');
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

$('#boardsList').on('change', function() {
  populateListsList();
});

$('#createCard').on('click', function () {
  if (!currentImage) { return; }
  if (!validateCardName() || !validateCardDesc()) { return; }
  
  var selectedListId = $('#listsList option:selected').val();
  
  tc.createCardOnTopOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), function (err, cardId) {
    $('#progress-bar-container').css('display', 'block');
    tc.attachBase64ImageToCard(cardId, currentImage, updateUploadProgress);
  });
});

// Initialization
populateBoardsList(function() {
  $('#boardsList').trigger('change');
});



// When we receive an image
// TODO: Check how to right-size the image without changing its form too much, or accept parts of it being cut (i.e. JIRA Capture cuts the image)
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    $('#screenshot-pane').css('background-image', 'url(' + request.imageData + ')');
    currentImage = request.imageData;
});



