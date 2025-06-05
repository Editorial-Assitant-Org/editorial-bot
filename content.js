function simulateClick(element) {
  const evt = document.createEvent('MouseEvents');
  evt.initEvent('click', true, true);
  element.dispatchEvent(evt);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runEditorialBot') {
    try {
      // Debug: List all <a> tags on the page and their text
      const allLinks = Array.from(document.querySelectorAll('a'));
      const linkTexts = allLinks.map(a => a.textContent.replace(/\s+/g, ' ').trim());
      console.log('Debug: All <a> texts on page:', linkTexts);

      // Try to find the first link that includes "View Submission"
      const viewLink = allLinks.find(a =>
        a.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes('view submission')
      );

      if (viewLink) {
        // Highlight the parent row if possible
        let row = viewLink.closest('tr');
        if (row) {
          row.style.backgroundColor = '#fff59d';
          row.style.transition = 'background 0.5s';
        }
        // Extract and execute the JS function from the href if present
        const href = viewLink.getAttribute('href');
        if (href && href.startsWith('javascript:')) {
          const jsCode = href.replace(/^javascript:/i, '');
          eval(jsCode);
        } else {
          simulateClick(viewLink);
        }
        setTimeout(() => {
          const agreeBtn = Array.from(document.querySelectorAll('a,button')).find(el =>
            el.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes('agree to review')
          );
          if (agreeBtn) {
            simulateClick(agreeBtn);
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
        sendResponse({ status: 'No link with "View Submission" found on page. See console for all link texts.' });
      }
    } catch (e) {
      sendResponse({ status: 'Error: ' + e.message });
    }
    return true; // Required for async response
  }
});
