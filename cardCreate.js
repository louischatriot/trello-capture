/**
 * Main management interface
 */

var tc = new TrelloClient()
  , currentImage
  , chosenLabels = {}
  , possibleLabels = ["red", "orange", "yellow", "purple", "blue", "green"]
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
    cardWasCreated();
  }
}


// Give feedback to user that card was created and close page
function cardWasCreated() {
  console.log("This is the end");
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
  if (!currentImage) { return; }
  if (!validateCardName() || !validateCardDesc()) { return; }
  
  var selectedListId = $('#listsList option:selected').val();
  
  tc.createCardOnTopOfCurrentList(selectedListId, $('#cardName').val(), $('#cardDesc').val(), getSelectedLabels(), function (err, cardId) {
    $('#progress-bar-container').css('display', 'block');
    tc.attachBase64ImageToCard(cardId, currentImage, updateUploadProgress);
  });
});

// Initialization
populateBoardsList(function() {
  $('#boardsList').trigger('change');
});





var canvas = document.getElementById('canvas')
  , ctx = canvas.getContext('2d')
  , $screenshotPane = $('#screenshot-pane')
  , $canvas = $('#canvas')
  , canvasW = $screenshotPane.width()
  , canvasH = $screenshotPane.height()  
  ;

$canvas.attr('width', canvasW);
$canvas.attr('height', canvasH);




// When we receive an image
// TODO: Check how to right-size the image without changing its form too much, or accept parts of it being cut (i.e. JIRA Capture cuts the image)
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // $('#screenshot-pane').css('background-image', 'url(' + request.imageData + ')');
    currentImage = request.imageData;
    // $('#canvas').css('background-image', 'url(' + currentImage + ')');

    
    var image = new Image();
    image.src = currentImage;
    image.onload = function() {
      // TODO: Calculate non-scaling coordinates
      ctx.drawImage(image, 0, 0, canvasW, canvasH);
    };
    
});


$('#take').on('click', function () {
  currentImage = canvas.toDataURL();
  $('#dascreen').css('background-image', 'url(' + currentImage + ')');
});



var $currentRectangle
  , originTop
  , originLeft
  ;


$('#screenshot-pane').on('mousedown', function (evt) {
  console.log('mousedown');
  console.log(evt);
  
  $currentRectangle = $('<div class="rectangle"></div>');
  $('#screenshot-pane').append($currentRectangle);
  $currentRectangle.css('top', evt.clientY + 'px');
  $currentRectangle.css('left', evt.clientX + 'px');
  
  originTop = evt.clientY;
  originLeft = evt.clientX;
});

$('#screenshot-pane').on('mouseup', function () {
  var left = parseInt($currentRectangle.css('left').replace(/px/, ""), 10) - (canvasW / 4)   // TODO: mode robust way to do this of course
    , top = parseInt($currentRectangle.css('top').replace(/px/, ""), 10)
    , width = parseInt($currentRectangle.css('width').replace(/px/, ""), 10)
    , height = parseInt($currentRectangle.css('height').replace(/px/, ""), 10)
    ;
  
  ctx.setLineWidth(6);
  ctx.rect(left, top, width, height);
  ctx.stroke();

  $currentRectangle.css('display', 'none');
  $currentRectangle = null;
});

$('#screenshot-pane').on('mousemove', function (evt) {
  if (! $currentRectangle) { return; }

  if (originTop <= evt.clientY) {
    $currentRectangle.css('height', (evt.clientY - originTop) + 'px');
    $currentRectangle.css('top', originTop + 'px');
  } else {
    $currentRectangle.css('height', (originTop - evt.clientY) + 'px');
    $currentRectangle.css('top', evt.clientY + 'px');  
  }
  
  if (originLeft <= evt.clientX) {
    $currentRectangle.css('width', (evt.clientX - originLeft) + 'px');
    $currentRectangle.css('left', originLeft + 'px');
  } else {
    $currentRectangle.css('width', (originLeft - evt.clientX) + 'px');
    $currentRectangle.css('left', evt.clientX + 'px');  
  }
});
















