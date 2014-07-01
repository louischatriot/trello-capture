(function () {
  var createdTabUrl;
  var imageData;
  var selectText;

  // TODO: manage multiple opened tab before screenshot sen
function buttonClicked() {

  // Gets selected text
  chrome.tabs.executeScript({
    code: "window.getSelection().toString()"
  }, function(selection) {      
    selectText = selection[0];
  });

  // DeSelect text before getting image from that page
  chrome.tabs.executeScript({
      code: "window.getSelection().empty();"
  }, function(selection) {
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
        imageData = image;
       
        createdTabUrl = chrome.extension.getURL('cardCreate.html');
        
        chrome.tabs.query({ active: true }, function (tabs) {
          var i, tab;

          // Only select the current active tab, not any background tab or dev tools
          for (i = 0; i < tabs.length; i += 1) {
            // TODO: more robust way to check if current tab is a page from this extension (either when I get a static extension id or with a flag)
            if (tabs[i].url.match(/^http/) || tabs[i].url.match(/^chrome-extension.*\/cardCreate\.html$/)) {
              tab = tabs[i];
            }
          }
          
          chrome.tabs.create({ url: createdTabUrl, index: (tab.index || 0) + 1 }, onTabCreated);
        });
      });
    });     
  }

  // TODO: more robust way to send image data to page ?
  function onTabCreated(tab) {
    setTimeout(function (){      
      chrome.runtime.sendMessage({ imageData: imageData, cardName: selectText }, function(response) {
        // Callback does nothing
      });
      chrome.runtime.sendMessage({ imageData: imageData, cardName: selectText }, function(response) {
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
