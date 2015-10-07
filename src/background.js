(function () {
  "use strict";

  var currentIndex = [];

  function getCurrentActiveTab() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
      console.debug(tabs[0].windowId + ' - chrome.tabs.query - set currentIndex = index: ' + tabs[0].index);
      currentIndex[tabs[0].windowId] = tabs[0].index;
    });
    // fallback
    chrome.windows.getCurrent(function(window) {
      if (!Number.isInteger(currentIndex[window.id])) {
        // last position (default behavior)
        chrome.tabs.query({currentWindow: true}, function (tabs) {
          console.debug(tabs[0].windowId + ' - fallback - set currentIndex = tabs.length: ' + tabs.length);
          currentIndex[tabs[0].windowId] = tabs.length;
        });
      }
    });
  }

  function moveIt(tab, event) {
    console.debug(tab.windowId + ' - chrome.tabs.' + event + ' - get new tab.index: ' + tab.index);
    console.debug(tab.windowId + ' - chrome.tabs.' + event + ' - get currentIndex: ' + currentIndex[tab.windowId]);
    if (Number.isInteger(currentIndex[tab.windowId])) {
      var moveToIndex = currentIndex[tab.windowId] + 1;
      if (tab.index == moveToIndex) {
        console.debug(tab.windowId + ' - chrome.tabs.' + event + ' - tab.index: ' + tab.index + ' == moveToIndex: ' + moveToIndex + ' (nothing to do)');
        return;
      }
      console.debug(tab.windowId + ' - chrome.tabs.' + event + ' - move to: ' + moveToIndex);
      chrome.tabs.move(tab.id, {
        index: moveToIndex
      });
    }
  }

  var eventOnMoved = function (tabId, moveInfo) {
    console.debug(moveInfo.windowId + ' - chrome.tabs.onMoved - set currentIndex = moveInfo.toIndex: ' + moveInfo.toIndex);
    currentIndex[moveInfo.windowId] = moveInfo.toIndex;
  }

  /**
   * Remember the current tab index
   */
  // on extension install/update
  chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == 'install' || details.reason == 'update') {
      console.debug('chrome.runtime.onInstalled');
      getCurrentActiveTab();
    }
  });
  // on extension enabled
  chrome.management.onEnabled.addListener(function(ExtensionInfo) {
    if (ExtensionInfo.id == chrome.runtime.id) {
      console.debug('chrome.management.onEnabled');
      getCurrentActiveTab();
    }
  });
  // on window focused
  chrome.windows.onFocusChanged.addListener(function(windowId) {
    // https://developer.chrome.com/extensions/windows#property-WINDOW_ID_NONE
    if (windowId != -1 && windowId != -2) {
      chrome.tabs.getSelected(chrome.tabs.windowId, function(tab) {
        console.debug(windowId + ' - chrome.windows.onFocusChanged - set currentIndex = tab.index: ' + tab.index);
        currentIndex[windowId] = tab.index;
      });
    }
  });
  // on tab activated
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    } else {
      chrome.tabs.get(activeInfo.tabId, function(tab) {
        console.debug(tab.windowId + ' - chrome.tabs.onActivated - set currentIndex = tab.index: ' + tab.index);
        currentIndex[tab.windowId] = tab.index;
      });
    }
  });
  // on tab manually moved
  chrome.tabs.onMoved.addListener(eventOnMoved);

  /**
   * Move new tab after the current
   */
  // on created
  chrome.tabs.onCreated.addListener(function(tab) {
    chrome.tabs.onMoved.removeListener(eventOnMoved);
    moveIt(tab, 'onCreated');
    chrome.tabs.onMoved.addListener(eventOnMoved);
  });
})();