import chromadb
from pydantic import BaseModel, Field

# Initialize Chroma client locally in the workspace
try:
    chroma_client = chromadb.PersistentClient(path="./nova_memory")
    collection = chroma_client.get_or_create_collection(name="nova_long_term_memory")
except Exception as e:
    collection = None
    print(f"Failed to initialize ChromaDB: {e}")

class StoreMemoryInput(BaseModel):
    key: str = Field(description="A short, unique identifier or title for this memory (e.g., 'user_preference_theme', 'database_schema').")
    content: str = Field(description="The detailed content to remember.")

class RetrieveMemoryInput(BaseModel):
    query: str = Field(description="The search query to find relevant memories.")
    n_results: int = Field(default=3, description="Number of memories to retrieve.")

def store_memory(key: str, content: str) -> str:
    if not collection:
        return "Error: Memory database is not available."
    try:
        # We use the key as the document ID
        collection.upsert(
            documents=[content],
            ids=[key]
        )
        return f"Successfully memorized under key: {key}"
    except Exception as e:
        return f"Error storing memory: {str(e)}"

def retrieve_memory(query: str, n_results: int = 3) -> str:
    if not collection:
        return "Error: Memory database is not available."
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        memories = results.get('documents', [[]])[0]
        if not memories:
            return "No relevant memories found."
            
        formatted = "\n---\n".join(memories)
        return f"Retrieved memories:\n{formatted}"
    except Exception as e:
        return f"Error retrieving memory: {str(e)}"

memory_tools = [
    {
        "type": "function",
        "function": {
            "name": "store_memory",
            "description": "Store important information, user preferences, or codebase context into long-term vector memory.",
            "parameters": StoreMemoryInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "retrieve_memory",
            "description": "Semantic search to retrieve past memories, preferences, or context.",
            "parameters": RetrieveMemoryInput.model_json_schema()
        }
    }
]
