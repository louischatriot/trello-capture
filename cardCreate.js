/**
 * Main management interface
 */

var tc = new TrelloClient()
  , currentImage;


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



// =================================================

$('#boardsList').on('change', function() {
  populateListsList();
});

$('#createCard').on('click', function () {
  if (!currentImage) { return; }
  
  var selectedListId = $('#listsList option:selected').val()
  tc.createCardOnTopOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), function (err, cardId) {
    tc.attachBase64ImageToCard(cardId, currentImage);
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



