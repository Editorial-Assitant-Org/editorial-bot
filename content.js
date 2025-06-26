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

  // Find all individual email messages in the thread
  const messageElements = document.querySelectorAll('.gs');
  
  if (messageElements.length > 0) {
    // Get the last message in the thread, which is the one we care about
    const latestMessage = messageElements[messageElements.length - 1];

    // 2. Find the Editor/Sender from within the last message block, skipping any sender fields that say 'me'
    const senderCandidates = Array.from(latestMessage.querySelectorAll('span.gD[email], span[email]'));
    let foundEditor = '';
    for (const el of senderCandidates) {
      const name = el.innerText.trim();
      if (name.toLowerCase() !== 'me' && name.length > 0) {
        // Format as 'Lastname, Firstname' if possible, but avoid double commas
        if (name.includes(',')) {
          foundEditor = name;
        } else {
          const nameParts = name.split(' ').filter(part => part);
          if (nameParts.length >= 2) {
            const lastName = nameParts[nameParts.length - 1];
            const firstName = nameParts.slice(0, nameParts.length - 1).join(' ');
            foundEditor = `${lastName}, ${firstName}`;
          } else {
            foundEditor = name;
          }
        }
        // Remove any extra whitespace or trailing commas
        foundEditor = foundEditor.replace(/,+/g, ',').replace(/^,|,$/g, '').trim();
        break;
      }
    }
    editor = foundEditor;

    // 3. The decision is the body of the last message.
    const bodyElement = latestMessage.querySelector('.a3s.aiL, .a3s.aXjCH, div.adn.ads');
    if (bodyElement) {
      let fullText = bodyElement.innerText.trim();
      // Remove quoted previous email blocks
      const quotedHeaderRegex = /\n\s*(From:|Sent:|To:|Subject:).*/is;
      const match = fullText.match(quotedHeaderRegex);
      if (match && match.index > 0) {
        decision = fullText.substring(0, match.index).trim();
      } else {
        decision = fullText;
      }
    }
  } else {
      // Fallback for simpler email views without threads
      const senderElements = document.querySelectorAll('span.gD[email]');
      if (senderElements.length > 0) {
          const senderName = senderElements[0].innerText.trim();
          const nameParts = senderName.split(' ').filter(part => part);
          if (nameParts.length >= 2) {
              const lastName = nameParts[nameParts.length - 1];
              const firstName = nameParts.slice(0, nameParts.length - 1).join(' ');
              editor = `${lastName}, ${firstName}`;
          } else {
              editor = senderName;
          }
      }
      const bodyElement = document.querySelector('.a3s.aiL, .a3s.aXjCH, div.adn.ads');
      if (bodyElement) {
          decision = bodyElement.innerText.trim();
      }
  }

  return { manuscript, editor, decision };
}
