chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractEmailData') {
    const data = extractDataFromEmail();
    sendResponse(data);
  }
  return true; // Keep the message channel open for asynchronous response
});

function extractDataFromEmail() {
  let manuscript = '';
  let editor = '';
  let decision = '';

  // 1. Find Manuscript ID from the email subject
  const subjectElement = document.querySelector('h2.hP');
  if (subjectElement) {
    const subjectText = subjectElement.innerText;
    const manuscriptMatch = subjectText.match(/[A-Z]+-[A-Z]+-\d{2}-\d+R?\d*/i);
    if (manuscriptMatch) {
      manuscript = manuscriptMatch[0];
    }
  }

  // 2. Find the Editor/Sender from the 'from' field
  const senderElement = document.querySelector('span.gD');
  if (senderElement) {
    editor = senderElement.innerText.trim();
  } else {
    const senderElementFallback = document.querySelector('span[email]');
    if (senderElementFallback) {
        editor = senderElementFallback.innerText.trim();
    }
  }

  // 3. The decision is the entire body of the email.
  const emailBody = document.querySelector('.a3s.aiL, .a3s.aXjCH'); // Common selector for email body in Gmail
  if (emailBody) {
    decision = emailBody.innerText.trim();
  } else {
    // A fallback for different Gmail structures or if the main one fails.
    const fallbackBody = document.querySelector('div.adn.ads');
    if(fallbackBody) {
        decision = fallbackBody.innerText.trim();
    }
  }

  return { manuscript, editor, decision };
}
