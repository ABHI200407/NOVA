from playwright.sync_api import sync_playwright
from pydantic import BaseModel, Field

class ReadBrowserPageInput(BaseModel):
    url: str = Field(description="The URL to navigate to and extract content from.")

def read_browser_page(url: str) -> str:
    """
    Uses Playwright to navigate to a URL, wait for dynamic content to load,
    and extracts the visible text. This is useful for JS-heavy sites where standard HTTP requests fail.
    """
    try:
        with sync_playwright() as p:
            # Launch headless browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Go to URL and wait until the network is idle to ensure JS framework content loads
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Extract main text content, stripping out excess whitespace
            # A simple approach: grab all text from the body
            content = page.locator("body").inner_text()
            
            browser.close()
            
            # Truncate content if it's too massive to avoid blowing up the LLM context
            if len(content) > 20000:
                content = content[:20000] + "\n\n... [Content Truncated due to length] ..."
                
            return f"Successfully extracted content from {url}:\n\n{content}"
    except Exception as e:
        return f"Error reading browser page: {str(e)}"

browser_tools = [
    {
        "type": "function",
        "function": {
            "name": "read_browser_page",
            "description": "Uses a headless Chromium browser to visit a webpage and extract the rendered text. Useful for single-page applications or JS-heavy sites.",
            "parameters": ReadBrowserPageInput.model_json_schema()
        }
    }
]
