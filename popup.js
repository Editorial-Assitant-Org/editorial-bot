document.getElementById('run-bot').addEventListener('click', async () => {
  document.getElementById('status').innerText = 'Running...';
  // Send message to content script
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'runEditorialBot' }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('status').innerText = 'Could not run on this page.';
    } else {
      document.getElementById('status').innerText = response && response.status ? response.status : 'Done!';
    }
  });
});
