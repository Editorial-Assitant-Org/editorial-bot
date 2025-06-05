chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runEditorialBot') {
    try {
      // Find the first row in the table (skip header)
      const table = document.querySelector('table');
      if (!table) {
        sendResponse({ status: 'Table not found.' });
        return;
      }
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) {
        sendResponse({ status: 'No data rows found.' });
        return;
      }
      const firstDataRow = rows[1];
      // Highlight the row
      firstDataRow.style.backgroundColor = '#fff59d';
      firstDataRow.style.transition = 'background 0.5s';
      // Find "View Submission" and click
      const viewLink = Array.from(firstDataRow.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'view submission');
      if (viewLink) {
        viewLink.click();
        setTimeout(() => {
          // After navigation, try to find and click "Agree to Review"
          const agreeBtn = Array.from(document.querySelectorAll('a,button')).find(el => el.textContent.trim().toLowerCase().includes('agree to review'));
          if (agreeBtn) {
            agreeBtn.click();
            setTimeout(() => {
              // Go back and refresh
              window.history.back();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }, 1000);
          }
        }, 1500);
        sendResponse({ status: 'Clicked View Submission and Agree to Review.' });
      } else {
        sendResponse({ status: 'View Submission link not found.' });
      }
    } catch (e) {
      sendResponse({ status: 'Error: ' + e.message });
    }
    // Required for async response
    return true;
  }
});
