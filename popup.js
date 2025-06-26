document.addEventListener('DOMContentLoaded', () => {
  const manuscriptTextarea = document.getElementById('manuscript');
  const editorTextarea = document.getElementById('editor');
  const decisionTextarea = document.getElementById('decision');
  const copyStatus = document.getElementById('copy-status');

  // 1. Load data from storage first
  chrome.storage.local.get(['manuscript', 'editor', 'decision'], (result) => {
    manuscriptTextarea.value = result.manuscript || 'Go to Gmail to fetch data.';
    editorTextarea.value = result.editor || '';
    decisionTextarea.value = result.decision || '';
  });

  // 2. Then, check the current tab to see if we should fetch new data
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url && activeTab.url.includes('mail.google.com')) {
      // If on Gmail, send a message to the content script to get fresh data
      chrome.tabs.sendMessage(activeTab.id, { action: 'extractEmailData' }, (response) => {
        if (chrome.runtime.lastError) {
          // Error communicating, do nothing and rely on stored data
          console.log('Could not establish connection. Using stored data.');
          return;
        }
        if (response) {
          // Update the textareas with the new data
          manuscriptTextarea.value = response.manuscript || 'Not found';
          editorTextarea.value = response.editor || 'Not found';
          decisionTextarea.value = response.decision || 'Not found';

          // Save the new data to storage
          chrome.storage.local.set({
            manuscript: response.manuscript,
            editor: response.editor,
            decision: response.decision
          });
        }
      });
    }
  });

  // 3. Set up copy buttons (this works independently)
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetTextarea = document.getElementById(targetId);

      targetTextarea.select();
      document.execCommand('copy');

      window.getSelection().removeAllRanges();

      copyStatus.textContent = `Copied ${targetId}!`;
      setTimeout(() => {
        copyStatus.textContent = '';
      }, 2000);
    });
  });
});
