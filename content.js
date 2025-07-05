chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractEmailData') {
    const data = extractDataFromEmail();
    // sendResponse may throw "Extension context invalidated" if the popup/extension was closed
    try {
      if (chrome.runtime?.id) {
        sendResponse(data);
      }
    } catch (e) {
      console.warn('Editorial Assistant: unable to send email data response –', e.message);
    }
  } else if (request.action === 'extractAssignmentData') {
    const data = extractAssignmentData();
    try {
      if (chrome.runtime?.id) {
        sendResponse(data);
      }
    } catch (e) {
      console.warn('Editorial Assistant: unable to send assignment data response –', e.message);
    }
  }
  // All responses above are synchronous, so no need to keep the channel open.
  return false;
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
      // Remove common disclaimers/footers
      if (decision) {
        // List of patterns that indicate start of disclaimer/footer
        const disclaimerPatterns = [
          /\n?={5,}.*/i, // lines of ====
          /Please note that this e-mail[\s\S]*/i,
          /Disclaimer ID:[\s\S]*/i,
          /This message and any attachment[\s\S]*/i,
          /This email and any files transmitted[\s\S]*/i,
          /The information contained in this email[\s\S]*/i
        ];
        for (const pattern of disclaimerPatterns) {
          const m = decision.match(pattern);
          if (m && m.index >= 0) {
            decision = decision.substring(0, m.index).trim();
          }
        }
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

function extractAssignmentData(rootDoc = document) {
  console.log('Editorial Assistant: extracting assignments in doc', rootDoc === document ? 'top' : 'iframe');
  const emailHeaders = [];
  let targetTable = null;

  const tables = rootDoc.querySelectorAll('table');

  const normalize = text => text.replace(/\s+/g, ' ').replace(/▲|▼/g, '').trim().toLowerCase();

  console.log('Editorial Assistant: tables found', tables.length);
  tables.forEach(table => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;
    const headerTexts = Array.from(firstRow.querySelectorAll('th, td'))
                             .map(cell => normalize(cell.textContent));

    const hasManuscript = headerTexts.some(h => h.startsWith('manuscript number') || h.startsWith('manuscript'));
    const hasDue = headerTexts.some(h => /review\s*due/.test(h) || h.includes('datereviewdue') || h.includes('reviewdue'));

    if (hasManuscript && hasDue) {
      console.log('Editorial Assistant: target table located');
      targetTable = table;
    }
  });

  if (!targetTable) {
    // Search inside same-origin iframes (e.g., reviewer_current.asp)
    const iframes = rootDoc.querySelectorAll('iframe');
    for (const frame of iframes) {
      try {
        const innerDoc = frame.contentDocument || frame.contentWindow.document;
        if (!innerDoc) continue;
        const result = extractAssignmentData(innerDoc);
        emailHeaders.push(...result.emailHeaders);
        if (emailHeaders.length) return { emailHeaders };
      } catch (e) {
        // cross-origin or inaccessible
        continue;
      }
    }
  }

  if (targetTable) {
    // Re-read headers from the found table to get correct indices
    const headerCells = Array.from(targetTable.querySelector('tr').querySelectorAll('th, td'));
    const headers = headerCells.map(cell => normalize(cell.textContent));

    const manuscriptColIndex = headers.findIndex(h => h.startsWith('manuscript number') || h.startsWith('manuscript'));
    const dueDateColIndex = headers.findIndex(h => /review\s*due/.test(h) || h.includes('datereviewdue') || h.includes('reviewdue'));

    console.log('Editorial Assistant: manuscriptCol', manuscriptColIndex, 'dueCol', dueDateColIndex);
    if (manuscriptColIndex > -1 && dueDateColIndex > -1) {
        const rows = Array.from(targetTable.querySelectorAll('tr')).slice(1); // skip header row
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > manuscriptColIndex && cells.length > dueDateColIndex) {
            const manuscriptNumber = cells[manuscriptColIndex].textContent.trim();
            const dateReviewDue = cells[dueDateColIndex].textContent.trim();

            if (manuscriptNumber && dateReviewDue) {
              emailHeaders.push(`${manuscriptNumber} DUE ${dateReviewDue}`);
              console.log('Editorial Assistant: row added', manuscriptNumber, dateReviewDue);
            }
          }
        });
    }
  }

  return { emailHeaders };
}
