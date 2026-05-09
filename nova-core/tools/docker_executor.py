import docker
from pydantic import BaseModel, Field

# Initialize Docker client (assumes Docker is running on host)
try:
    client = docker.from_env()
except Exception as e:
    client = None
    print(f"Failed to connect to Docker daemon: {e}")

class RunCommandInput(BaseModel):
    command: str = Field(description="The shell command to execute.")

BLOCKLIST = ["rm -rf /", "sudo", ":(){ :|:& };:"] # Basic blocklist

def run_command_in_sandbox(command: str) -> str:
    if not client:
        return "Error: Docker daemon is not available on the host system. Cannot execute secure commands."
    
    # Check blocklist
    for blocked in BLOCKLIST:
        if blocked in command:
            return f"Error: Command rejected for security reasons. Contains blocked pattern: {blocked}"

    try:
        # Run command inside a fresh, isolated Python container
        # Setting limits: 1 CPU, 256MB RAM
        container = client.containers.run(
            "python:3.10-slim",
            command=f"sh -c '{command}'",
            detach=False,
            remove=True, # Auto-remove after execution
            mem_limit="256m",
            nano_cpus=1000000000 # 1 CPU
        )
        return container.decode('utf-8')
    except docker.errors.ContainerError as e:
        return f"Command execution failed with exit code {e.exit_status}:\n{e.stderr.decode('utf-8')}"
    except Exception as e:
        return f"Error executing command: {str(e)}"

docker_tools = [
    {
        "type": "function",
        "function": {
            "name": "run_command_in_sandbox",
            "description": "Securely execute a shell command inside an isolated Docker container.",
            "parameters": RunCommandInput.model_json_schema()
        }
    }
]
