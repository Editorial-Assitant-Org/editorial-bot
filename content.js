function simulateClick(element) {
  const evt = document.createEvent('MouseEvents');
  evt.initEvent('click', true, true);
  element.dispatchEvent(evt);
}

// Single top-level function for review automation
function tryFillReviewForm() {
  // 1. Select “Yes, I agree my review may be published alongside the article.”
  const yesPublishRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(el => {
    return (
      el.value.trim().toLowerCase().includes('yes') &&
      el.closest('label, span, div, td, tr') &&
      /agree.*publish/i.test(el.closest('label, span, div, td, tr').innerText)
    );
  });
  if (yesPublishRadio) yesPublishRadio.checked = true;

  // 2. For “If accepted for publication... Editorial Comment?” select “Yes” (dropdown or radio)
  const editorialDropdown = Array.from(document.querySelectorAll('select')).find(sel => {
    return sel.previousElementSibling && /editorial comment/i.test(sel.previousElementSibling.innerText);
  });
  if (editorialDropdown) {
    const yesOption = Array.from(editorialDropdown.options).find(opt => /yes/i.test(opt.text));
    if (yesOption) editorialDropdown.value = yesOption.value;
    editorialDropdown.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // Try as radio
    const editorialRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(el => {
      return (
        el.value.trim().toLowerCase().includes('yes') &&
        el.closest('label, span, div, td, tr') &&
        /editorial comment/i.test(el.closest('label, span, div, td, tr').innerText)
      );
    });
    if (editorialRadio) editorialRadio.checked = true;
  }

  // 3. “Are you willing to write one?” input “Yes” (text input or textarea)
  const willingInput = Array.from(document.querySelectorAll('input[type="text"], textarea')).find(el => {
    return el.previousElementSibling && /willing.*write/i.test(el.previousElementSibling.innerText);
  });
  if (willingInput) {
    willingInput.value = 'Yes';
    willingInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // 4. Paste reviewer comments (prompt user for input)
  const reviewerComment = window.prompt('Please enter your reviewer comment:');
  if (reviewerComment !== null) {
    const commentBox = Array.from(document.querySelectorAll('textarea')).find(el => {
      return el.previousElementSibling && /reviewer comments/i.test(el.previousElementSibling.innerText);
    });
    if (commentBox) {
      commentBox.value = reviewerComment;
      commentBox.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  // Optionally, submit the form automatically (uncomment if desired):
  // const submitBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => /submit/i.test(el.innerText || el.value));
  // if (submitBtn) simulateClick(submitBtn);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runEditorialBot') {
    try {
      tryFillReviewForm();
      setTimeout(tryFillReviewForm, 1500);
      sendResponse({ status: 'Ran review form automation.' });
    } catch (e) {
      sendResponse({ status: 'Error: ' + e.message });
    }
    return true; // Required for async response
  }
});
