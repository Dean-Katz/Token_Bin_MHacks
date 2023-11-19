function updatePopup(tokenCount, wordCount) {
  const countElement = document.getElementById("count");
  countElement.innerText = `${Math.round(tokenCount)} tokens = ${wordCount} words`;
}

function sendMessage(retryCount = 0) {
  if (retryCount > 5) return; // Stop retrying after 5 attempts

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "requestCounts" }, (response) => {
      if (chrome.runtime.lastError) {
        setTimeout(() => {
          sendMessage(retryCount + 1);
        }, 100);
      } else if (response && response.type === "counts") {
        updatePopup(response.tokenCount, response.wordCount);
      }
    });
  });
}

sendMessage();
