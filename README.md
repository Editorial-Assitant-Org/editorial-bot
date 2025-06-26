# Editorial Assistant Extension

A Chrome/Edge extension to streamline editorial workflows by extracting manuscript details, editor names, and decision content from Gmail emails and making them easily available for copying and pasting into Editorial Manager® or similar platforms.

## Features
- Extracts **Manuscript ID**, **Editor**, and **Decision** from Gmail emails automatically.
- Remembers extracted data so you can access it on other pages (e.g., Editorial Manager).
- Lets you copy each field with a single click.
- Provides a **Paste** button for the Decision field (for pasting text copied from Word documents or other sources).
- Designed for editors and reviewers to quickly transfer decision text and metadata between Gmail and editorial systems.

## Installation
1. Clone or download this repository to your computer.
2. Open Chrome or Edge and go to `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer mode** (toggle in the top right or bottom left).
4. Click **Load unpacked** and select the `editorial-bot` folder.
5. The extension icon will appear in your browser toolbar.

## Usage
### Extracting from Gmail
1. Open a relevant email in Gmail (the extension works best with single emails, not conversation view).
2. Click the extension icon.
3. The popup will auto-populate the **Manuscript**, **Editor**, and **Decision** fields.
   - **Decision** is the body of the email, excluding any quoted previous messages.
   - **Editor** is the sender of the email, formatted as `Lastname, Firstname`.
4. Click **Copy** next to any field to copy its contents.

### Pasting Decision from Word Documents
1. Copy the decision text from your Word document (Ctrl+C).
2. Open the extension popup and click **Paste** next to the Decision field.
3. The pasted text is saved and can be copied as needed.

### Using on Editorial Manager
1. Navigate to the Editorial Manager page where you need to paste the details.
2. Open the extension popup—the last extracted or pasted data will be available.
3. Use the **Copy** buttons to transfer data into Editorial Manager fields.


