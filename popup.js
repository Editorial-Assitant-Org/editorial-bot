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
      chrome.tabs.sendMessage(activeTab.id, { action: 'extractEmailData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not establish connection. Using stored data.');
          return;
        }
        if (response) {
          manuscriptTextarea.value = response.manuscript || 'Not found';
          editorTextarea.value = response.editor || 'Not found';
          decisionTextarea.value = response.decision || 'Not found';
          chrome.storage.local.set({
            manuscript: response.manuscript,
            editor: response.editor,
            decision: response.decision
          });
        }
      });
    }
  });

  // 3. Set up copy buttons
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetTextarea = document.getElementById(targetId);
      targetTextarea.select();
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      copyStatus.textContent = `Copied ${targetId}!`;
      setTimeout(() => { copyStatus.textContent = ''; }, 2000);
    });
  });

  // 4. Set up the Paste button
  const pasteButton = document.getElementById('paste-decision-btn');
  pasteButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      decisionTextarea.value = text;
      // Save the pasted decision to storage
      chrome.storage.local.get(['manuscript', 'editor'], (result) => {
        chrome.storage.local.set({
          manuscript: result.manuscript,
          editor: result.editor,
          decision: text
        });
      });
      copyStatus.textContent = 'Pasted decision!';
      setTimeout(() => { copyStatus.textContent = ''; }, 2000);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      copyStatus.textContent = 'Paste failed!';
      setTimeout(() => { copyStatus.textContent = ''; }, 2000);
    }
  });
});
