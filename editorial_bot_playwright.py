from playwright.sync_api import sync_playwright
import os
from dotenv import load_dotenv

load_dotenv()

def run_editorial_bot(journal_url, username, password):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(journal_url)

        # Handle OneTrust cookie banner if present
        try:
            # Try the most common OneTrust accept button selectors
            page.wait_for_selector('#onetrust-accept-btn-handler', timeout=5000)
            page.click('#onetrust-accept-btn-handler')
            page.wait_for_timeout(2000)  # Wait 2 seconds for the page to update
        except Exception as e:
            print("[INFO] OneTrust cookie banner not found or already accepted.")

        # List all frames for debugging
        print("[DEBUG] Listing all frames and their URLs:")
        login_frame = None
        for frame in page.context.pages[0].frames:
            print("Frame name:", frame.name, "URL:", frame.url)
            try:
                if frame.query_selector('#username'):
                    print("[DEBUG] Found username field in frame:", frame.url)
                    login_frame = frame
                    break
            except Exception:
                continue

        if not login_frame:
            print("[ERROR] Username field not found in any frame. Dumping main page HTML for debugging:")
            print(page.content())
            browser.close()
            exit(1)

        # Fill username and password in the correct frame
        login_frame.fill('#username', username)
        login_frame.fill('#passwordTextbox', password)
        # Click the "Reviewer Login" button
        login_frame.click('input[name="reviewerLogin"]')
        # Wait for navigation to complete
        login_frame.wait_for_load_state('networkidle')

        # Wait for the assignments section to load
        page.wait_for_timeout(3000)  # Wait 3 seconds

        # Debug: List all frames and dump their HTML
        print("[DEBUG] Listing all frames and their URLs after login and wait:")
        for frame in page.context.pages[0].frames:
            print("Frame name:", frame.name, "URL:", frame.url)
        for idx, frame in enumerate(page.context.pages[0].frames):
            try:
                with open(f"frame_{idx}_after_login.html", "w", encoding="utf-8") as f:
                    f.write(frame.content())
            except Exception as e:
                print(f"[WARN] Could not dump frame {idx} HTML: {e}")

        # Wait for and click "New Reviewer Invitations" in any frame
        clicked = False
        for frame in page.context.pages[0].frames:
            try:
                link = frame.query_selector('a[href="Reviewer_NewInvitations.aspx"]')
                if link:
                    link.click()
                    print(f"[INFO] Clicked 'New Reviewer Invitations' in frame: {frame.url}")
                    clicked = True
                    break
            except Exception as e:
                continue

        if not clicked:
            print("[ERROR] Could not find or click 'New Reviewer Invitations' in any frame.")
            page.screenshot(path="new_reviewer_invitations_error.png")
            browser.close()
            exit(1)

        # Wait longer after clicking 'New Reviewer Invitations' to allow frames to load
        page.wait_for_timeout(5000)

        # Debug: Dump all frame HTML and print all <a> link texts in all frames
        for idx, frame in enumerate(page.context.pages[0].frames):
            try:
                with open(f"frame_{idx}_after_new_invitation.html", "w", encoding="utf-8") as f:
                    f.write(frame.content())
                links = frame.query_selector_all('a')
                link_texts = [(link.inner_text() or '').replace('\xa0', ' ').strip() for link in links]
                print(f"[DEBUG] Frame {idx} ({frame.url}) <a> link texts: {link_texts}")
            except Exception as e:
                print(f"[WARN] Could not dump frame {idx} HTML or list links: {e}")

        import os
        from playwright.sync_api import expect

        download_path = os.path.abspath("downloaded_submission.pdf")
        view_clicked = False
        with page.expect_download() as download_info:
            for frame in page.context.pages[0].frames:
                try:
                    # Normalize text to handle possible whitespace issues
                    links = frame.query_selector_all('a')
                    for link in links:
                        text = (link.inner_text() or '').replace('\xa0', ' ').strip().lower()
                        if 'view submission' in text:
                            link.click()
                            print(f"[INFO] Clicked 'View Submission' in frame: {frame.url}")
                            view_clicked = True
                            break
                    if view_clicked:
                        break
                except Exception as e:
                    continue
            if not view_clicked:
                print("[ERROR] Could not find or click 'View Submission' in any frame.")
                page.screenshot(path="view_submission_error.png")
                browser.close()
                exit(1)
        download = download_info.value
        download.save_as(download_path)
        print(f"[INFO] Downloaded submission PDF to {download_path}")

        # Wait for and click 'Agree to Review' in any frame
        page.wait_for_timeout(1500)  # Wait for page to update after download
        agree_clicked = False
        for frame in page.context.pages[0].frames:
            try:
                # Look for 'Agree to Review' buttons/links
                elements = frame.query_selector_all('a,button')
                for el in elements:
                    text = (el.inner_text() or '').replace('\xa0', ' ').strip().lower()
                    if 'agree to review' in text:
                        el.click()
                        print(f"[INFO] Clicked 'Agree to Review' in frame: {frame.url}")
                        agree_clicked = True
                        break
                if agree_clicked:
                    break
            except Exception as e:
                continue
        if not agree_clicked:
            print("[ERROR] Could not find or click 'Agree to Review' in any frame.")
            page.screenshot(path="agree_to_review_error.png")
            browser.close()
            exit(1)

        # Wait for the action to complete, then re-click 'New Reviewer Invitations' to refresh the list
        page.wait_for_timeout(2000)
        clicked = False
        for frame in page.context.pages[0].frames:
            try:
                link = frame.query_selector('a[href="Reviewer_NewInvitations.aspx"]')
                if link:
                    link.click()
                    print(f"[INFO] Re-clicked 'New Reviewer Invitations' in frame: {frame.url}")
                    clicked = True
                    break
            except Exception:
                continue
        if not clicked:
            print("[ERROR] Could not re-click 'New Reviewer Invitations' after agreeing to review.")
            page.screenshot(path="reclick_new_reviewer_invitations_error.png")
            browser.close()
            exit(1)

        # Wait for and click "Agree to Review"
        page.wait_for_selector("text=Agree to Review", timeout=10000)
        page.click("text=Agree to Review")

        page.wait_for_timeout(2000)
        browser.close()

if __name__ == "__main__":
    # Load credentials and journal URL from environment variables
    journal_url = os.getenv("JOURNAL_URL")
    username = os.getenv("EM_USERNAME")
    password = os.getenv("EM_PASSWORD")
    run_editorial_bot(journal_url, username, password)
