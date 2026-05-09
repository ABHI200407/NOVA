import os
from pydantic import BaseModel, Field

class ReadFileInput(BaseModel):
    path: str = Field(description="The absolute or relative path of the file to read.")

class WriteFileInput(BaseModel):
    path: str = Field(description="The path where to write the file.")
    content: str = Field(description="The content to write to the file.")

class ListDirInput(BaseModel):
    path: str = Field(description="The directory path to list.")

def read_file(path: str) -> str:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

def write_file(path: str, content: str) -> str:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote to {path}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

def list_dir(path: str) -> str:
    try:
        items = os.listdir(path)
        return "\n".join(items)
    except Exception as e:
        return f"Error listing directory: {str(e)}"

# We can expose these as standard JSON-schema tools for LiteLLM
file_system_tools = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file.",
            "parameters": ReadFileInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write contents to a file. Overwrites if exists.",
            "parameters": WriteFileInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "List contents of a directory.",
            "parameters": ListDirInput.model_json_schema()
        }
    }
]
