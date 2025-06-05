# editorial-bot

An Edge extension that automates reviewer actions on Editorial Manager® journal platforms.


## Installation
1. Clone or download this repository to your computer.
2. Open Microsoft Edge and go to `edge://extensions/`.
3. Enable **Developer mode** (toggle in the bottom left).
4. Click **Load unpacked** and select the `editorial-bot` folder.
5. The extension icon will appear in your Edge toolbar.

## Usage
1. Navigate to any Editorial Manager page where you have reviewer invitations.
2. Click the "editorial-bot" icon in your Edge toolbar.
3. In the popup, click **Run Editorial Bot**.
4. The extension will highlight the first row, click "View Submission," then "Agree to Review," and refresh the page.


## Notes
- The extension acts on the first available invitation row by default.
- You can customize selectors in `content.js` if your Editorial Manager instance has a different layout.

---

This project is not affiliated with Editorial Manager® or Aries Systems Corporation. For personal workflow automation only.
