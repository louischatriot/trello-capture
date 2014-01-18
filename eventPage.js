(function () {
  var createdTabUrl;
  var imageData;
  
  function buttonClicked() {
    console.log('Clicked on the button');
    
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
      console.log("===== Took screenshot =====");
      imageData = image;
     
      createdTabUrl = chrome.extension.getURL('cardCreate.html');
      
      // Todo place it to the right of the current tab
      chrome.tabs.create({ url: createdTabUrl }, onTabCreated);
    });
  }

  function onTabCreated(tab) {
    console.log("===== TAB CREATED =====");
    console.log(tab);
    console.log(imageData);
    
    // chrome.tabs.sendMessage(tab.id, "any message");
    setTimeout(function (){
      chrome.runtime.sendMessage({ imageData: imageData }, function(response) {
        console.log('FAREWELL');
      });
    }, 1000);
    
    
    var views = chrome.extension.getViews();
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
        console.log(view);
        console.log(view.location.href);

      // If this view has the right URL and hasn't been used yet...
      if (view.location.href == createdTabUrl) {
        console.log("----------------------");
        // console.log(view);
        // console.log(view.location.href);
      }
    }

  }

  console.log("===== ENGAGED =====");
  chrome.browserAction.onClicked.addListener(buttonClicked);
})()
