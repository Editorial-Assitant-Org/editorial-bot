chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runEditorialBot') {
    try {
      // Find all tables on the page
      const tables = Array.from(document.querySelectorAll('table'));
      let targetRow = null;

      for (const table of tables) {
        // Find all rows except the header
        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        for (const row of rows) {
          // Look for a "View Submission" link in the row
          const viewLink = Array.from(row.querySelectorAll('a')).find(a =>
            a.textContent.trim().toLowerCase() === 'view submission'
          );
          if (viewLink) {
            targetRow = row;
            break;
          }
        }
        if (targetRow) break;
      }

      if (!targetRow) {
        sendResponse({ status: 'No data rows with "View Submission" found.' });
        return;
      }

      // Highlight the row
      targetRow.style.backgroundColor = '#fff59d';
      targetRow.style.transition = 'background 0.5s';

      // Click "View Submission"
      const viewLink = Array.from(targetRow.querySelectorAll('a')).find(a =>
        a.textContent.trim().toLowerCase() === 'view submission'
      );
      if (viewLink) {
        viewLink.click();
        setTimeout(() => {
          // After navigation, try to find and click "Agree to Review"
          const agreeBtn = Array.from(document.querySelectorAll('a,button')).find(el =>
            el.textContent.trim().toLowerCase().includes('agree to review')
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
