chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runEditorialBot') {
    try {
      const tables = Array.from(document.querySelectorAll('table'));
      let targetRow = null;
      let foundDebug = [];

      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        for (const row of rows) {
          // Find any link whose text includes "View Submission" (case insensitive, trimmed, whitespace-normalized)
          const viewLink = Array.from(row.querySelectorAll('a')).find(a =>
            a.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes('view submission')
          );
          if (viewLink) {
            targetRow = row;
            break;
          } else {
            // For debugging: collect all link texts
            foundDebug.push(Array.from(row.querySelectorAll('a')).map(a => a.textContent));
          }
        }
        if (targetRow) break;
      }

      if (!targetRow) {
        // For debugging: show what links were found
        console.log('Debug: Link texts found in rows:', foundDebug);
        sendResponse({ status: 'No data rows with a link containing "View Submission" found.' });
        return;
      }

      // Highlight the row
      targetRow.style.backgroundColor = '#fff59d';
      targetRow.style.transition = 'background 0.5s';

      // Click the "View Submission" link
      const viewLink = Array.from(targetRow.querySelectorAll('a')).find(a =>
        a.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes('view submission')
      );
      if (viewLink) {
        viewLink.click();
        setTimeout(() => {
          const agreeBtn = Array.from(document.querySelectorAll('a,button')).find(el =>
            el.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes('agree to review')
          );
          if (agreeBtn) {
            agreeBtn.click();
            setTimeout(() => {
              window.history.back();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }, 1000);
          }
        }, 1500);
        sendResponse({ status: 'Clicked View Submission and Agree to Review.' });
      } else {
        sendResponse({ status: 'View Submission link not found in the row.' });
      }
    } catch (e) {
      sendResponse({ status: 'Error: ' + e.message });
    }
    return true; // Required for async response
  }
});
