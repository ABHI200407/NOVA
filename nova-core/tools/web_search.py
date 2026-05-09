import os
from tavily import TavilyClient
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class WebSearchInput(BaseModel):
    query: str = Field(description="The search query to look up on the web.")

def search_web(query: str) -> str:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key or api_key == "your_tavily_api_key_here":
        return "Error: TAVILY_API_KEY is not configured in the environment."
    
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query, search_depth="advanced")
        
        # Format the results cleanly
        results = []
        for result in response.get("results", []):
            results.append(f"Title: {result.get('title')}\nURL: {result.get('url')}\nContent: {result.get('content')}\n---")
            
        return "\n".join(results) if results else "No results found."
    except Exception as e:
        return f"Error executing web search: {str(e)}"

web_tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for up-to-date information, documentation, and context.",
            "parameters": WebSearchInput.model_json_schema()
        }
    }
]
