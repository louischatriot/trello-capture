(function () {
  var createdTabUrl;
  var imageData;

  // TODO: manage multiple opened tab before screenshot send
  function buttonClicked() {
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
      imageData = image;
     
      createdTabUrl = chrome.extension.getURL('cardCreate.html');
      
      chrome.tabs.query({ active: true }, function (tabs) {
        var i, tab;

        // Only select the current active tab, not any background tab or dev tools
        for (i = 0; i < tabs.length; i += 1) {
          if (tabs[i].url.match(/^http/)) {
            tab = tabs[i];
          }
        }
        
        chrome.tabs.create({ url: createdTabUrl, index: tab.index + 1 }, onTabCreated);
      });
    });
  }

  // TODO: more robust way to send image data to page ?
  function onTabCreated(tab) {
    setTimeout(function (){
      chrome.runtime.sendMessage({ imageData: imageData }, function(response) {
        // Callback does nothing
      });
    }, 1000);
        
    var views = chrome.extension.getViews();
    for (var i = 0; i < views.length; i++) {
      var view = views[i];

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
