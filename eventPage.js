(function () {
  var createdTabUrl;
  var imageData;
  
  function buttonClicked() {
    console.log('Clicked on the button');
    
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
      console.log("===== Took screenshot =====");
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
