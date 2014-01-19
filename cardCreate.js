


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