import git
import os
from pydantic import BaseModel, Field

class GitInitInput(BaseModel):
    path: str = Field(description="The directory path to initialize as a Git repository.")

class GitCommitInput(BaseModel):
    path: str = Field(description="The directory path of the Git repository.")
    message: str = Field(description="The commit message.")

def git_init(path: str) -> str:
    try:
        os.makedirs(path, exist_ok=True)
        repo = git.Repo.init(path)
        return f"Successfully initialized empty Git repository in {path}"
    except Exception as e:
        return f"Error initializing Git repository: {str(e)}"

def git_commit(path: str, message: str) -> str:
    try:
        repo = git.Repo(path)
        repo.git.add(A=True) # Add all changes
        repo.index.commit(message)
        return f"Successfully committed changes with message: '{message}'"
    except Exception as e:
        return f"Error committing changes: {str(e)}"

git_tools = [
    {
        "type": "function",
        "function": {
            "name": "git_init",
            "description": "Initialize a new Git repository in a given directory.",
            "parameters": GitInitInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "git_commit",
            "description": "Stage all changes and create a Git commit with the provided message.",
            "parameters": GitCommitInput.model_json_schema()
        }
    }
]
