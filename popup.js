document.addEventListener('DOMContentLoaded', () => {
  const manuscriptTextarea = document.getElementById('manuscript');
  const editorTextarea = document.getElementById('editor');
  const decisionTextarea = document.getElementById('decision');
  const assignmentsContainer = document.getElementById('assignments-container');
  const copyAllBtn = document.getElementById('copy-all-btn');
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
      assignmentsContainer.innerHTML = '<p>Go to Editorial Manager for assignment data.</p>';
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
    } else if (activeTab.url && activeTab.url.includes('www.editorialmanager.com')) {
      manuscriptTextarea.value = 'Go to Gmail to fetch data.';
      editorTextarea.value = '';
      decisionTextarea.value = '';
      chrome.tabs.sendMessage(activeTab.id, { action: 'extractAssignmentData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          assignmentsContainer.innerHTML = '<p>Error fetching data. Please reload the extension and refresh the page.</p>';
          return;
        }
        if (response && response.emailHeaders && response.emailHeaders.length > 0) {
          displayAssignments(response.emailHeaders);
        } else {
          // Fallback: inject script directly when content script not present
          chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: () => {
              const normalize = t=>t.replace(/\s+/g,' ').replace(/▲|▼/g,'').trim().toLowerCase();
              const table = Array.from(document.querySelectorAll('table')).find(t=>{
                const headerCells = Array.from(t.querySelector('tr')?.querySelectorAll('th,td')||[]).map(c=>normalize(c.textContent));
                return headerCells.some(h=>h.startsWith('manuscript number')) && headerCells.some(h=>h.startsWith('date review due'));
              });
              const results=[];
              if(table){
                const headers = Array.from(table.querySelector('tr').querySelectorAll('th,td')).map(c=>normalize(c.textContent));
                const mIdx=headers.findIndex(h=>h.startsWith('manuscript number'));
                const dIdx=headers.findIndex(h=>h.startsWith('date review due'));
                if(mIdx>-1&&dIdx>-1){
                  Array.from(table.querySelectorAll('tr')).slice(1).forEach(r=>{
                    const cells=r.querySelectorAll('td');
                    if(cells.length>mIdx&&cells.length>dIdx){
                      const m=cells[mIdx].textContent.trim();
                      const d=cells[dIdx].textContent.trim();
                      if(m&&d) results.push(`${m} DUE ${d}`);
                    }
                  });
                }
              }
              return results;
            }
          }, (injectedResults)=>{
            const headers = injectedResults?.[0]?.result || [];
            if(headers.length){
              displayAssignments(headers);
            }else{
              assignmentsContainer.innerHTML = '<p>No assignment data found on this page.</p>';
            }
          });
        }
      });
    } else {
      manuscriptTextarea.value = 'Go to Gmail to fetch data.';
      editorTextarea.value = '';
      decisionTextarea.value = '';
      assignmentsContainer.innerHTML = '<p>Go to Editorial Manager for assignment data.</p>';
    }
  });

  function displayAssignments(headers) {
    assignmentsContainer.innerHTML = ''; // Clear previous content
    const table = document.createElement('table');
    table.className = 'assignments-table';

    headers.forEach(headerText => {
      const row = table.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);

      cell1.textContent = headerText;
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'copy-btn-row';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(headerText).then(() => {
          copyStatus.textContent = 'Copied!';
          setTimeout(() => { copyStatus.textContent = ''; }, 2000);
        });
      });
      cell2.appendChild(copyBtn);
    });

    assignmentsContainer.appendChild(table);
    copyAllBtn.style.display = 'block';

    copyAllBtn.addEventListener('click', () => {
      const allHeadersText = headers.join('\n');
      navigator.clipboard.writeText(allHeadersText).then(() => {
        copyStatus.textContent = 'Copied all!';
        setTimeout(() => { copyStatus.textContent = ''; }, 2000);
      });
    });
  }

  // 3. Set up original copy buttons
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
