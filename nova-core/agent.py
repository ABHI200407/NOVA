import json
import os
from typing import Annotated, Sequence, TypedDict, Literal
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from litellm import completion
import litellm

# Enable LangFuse observability
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

from tools.file_system import file_system_tools, read_file, write_file, list_dir
from tools.docker_executor import docker_tools, run_command_in_sandbox
from tools.web_search import web_tools, search_web
from tools.memory import memory_tools, store_memory, retrieve_memory
from tools.browser import browser_tools, read_browser_page
from tools.git_ops import git_tools, git_init, git_commit

# Define the State for LangGraph
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str

class NovaMultiAgent:
    def __init__(self, model_name: str = "gemini/gemini-1.5-pro", api_key: str = None):
        self.model_name = model_name
        self.api_key = api_key
        
        # Build the graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("Supervisor", self.supervisor_node)
        workflow.add_node("Coder", self.coder_node)
        workflow.add_node("Researcher", self.researcher_node)
        workflow.add_node("Executor", self.executor_node)
        
        # Define edges
        workflow.add_conditional_edges(
            "Supervisor",
            lambda x: x["next"],
            {
                "Coder": "Coder",
                "Researcher": "Researcher",
                "Executor": "Executor",
                "FINISH": END
            }
        )
        
        workflow.add_edge("Coder", "Supervisor")
        workflow.add_edge("Researcher", "Supervisor")
        workflow.add_edge("Executor", "Supervisor")
        
        workflow.set_entry_point("Supervisor")
        self.graph = workflow.compile()

        self.members = ["Coder", "Researcher", "Executor"]
        
    async def supervisor_node(self, state: AgentState):
        system_prompt = (
            "You are Nova Supervisor, coordinating the following workers: Coder, Researcher, Executor. "
            "Given the user request and the conversation history, decide who should act next. "
            "If the task is fully completed, respond with FINISH. "
            "Output only the name of the next worker or FINISH."
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in state["messages"]:
            messages.append({"role": msg.type, "content": msg.content})
            
        response = completion(
            model=self.model_name,
            messages=messages,
            api_key=self.api_key,
            temperature=0
        )
        
        next_agent = response.choices[0].message.content.strip()
        if next_agent not in self.members and next_agent != "FINISH":
            next_agent = "FINISH" # fallback
            
        return {"next": next_agent}

    def _execute_agent(self, state: AgentState, name: str, system_instruction: str, tools, tool_impls):
        messages = [{"role": "system", "content": system_instruction}]
        for msg in state["messages"]:
            messages.append({"role": msg.type, "content": msg.content})
            
        response = completion(
            model=self.model_name,
            messages=messages,
            tools=tools if tools else None,
            api_key=self.api_key
        )
        
        response_msg = response.choices[0].message
        final_content = response_msg.content or ""
        
        # Simple tool execution handler for the node
        if response_msg.tool_calls:
            for tool_call in response_msg.tool_calls:
                func_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                
                if func_name in tool_impls:
                    result = tool_impls[func_name](**args)
                    final_content += f"\n[Tool {func_name} Execution Result]:\n{result}"
                else:
                    final_content += f"\n[Tool {func_name} Execution Failed]: Tool not found."
                    
        return {"messages": [AIMessage(content=f"[{name}]: {final_content}")]}

    async def coder_node(self, state: AgentState):
        return self._execute_agent(
            state, "Coder", 
            "You are the Coder. You write and edit files. Use the file system tools provided. You can also use Git tools to commit changes.",
            file_system_tools + git_tools,
            {"read_file": read_file, "write_file": write_file, "list_dir": list_dir, "git_init": git_init, "git_commit": git_commit}
        )
        
    async def researcher_node(self, state: AgentState):
        return self._execute_agent(
            state, "Researcher",
            "You are the Researcher. You search the web, read specific browser pages, and store/retrieve long-term vector memories.",
            web_tools + browser_tools + memory_tools,
            {"search_web": search_web, "read_browser_page": read_browser_page, "store_memory": store_memory, "retrieve_memory": retrieve_memory}
        )

    async def executor_node(self, state: AgentState):
        return self._execute_agent(
            state, "Executor",
            "You are the Executor. You run terminal commands in a secure sandbox.",
            docker_tools,
            {"run_command_in_sandbox": run_command_in_sandbox}
        )

    async def run_step(self, user_input: str, websocket_manager, websocket):
        """Runs the LangGraph state machine and streams outputs to the websocket."""
        
        state = {"messages": [HumanMessage(content=user_input)], "next": ""}
        
        try:
            async for output in self.graph.astream(state, {"recursion_limit": 20}):
                for node_name, node_state in output.items():
                    if node_name == "Supervisor":
                        next_action = node_state.get("next")
                        await websocket_manager.send_personal_message(json.dumps({
                            "type": "thought",
                            "agentId": "Supervisor",
                            "content": f"Supervisor decision: Delegating to {next_action}"
                        }), websocket)
                    else:
                        # It's a worker node outputting a message
                        new_message = node_state["messages"][-1].content
                        
                        await websocket_manager.send_personal_message(json.dumps({
                            "type": "tool_execution",
                            "agentId": node_name,
                            "content": new_message
                        }), websocket)
                        
            # Final completion
            await websocket_manager.send_personal_message(json.dumps({
                "type": "message",
                "agentId": "Supervisor",
                "content": "Finished execution.",
                "role": "agent"
            }), websocket)
            
        except Exception as e:
            await websocket_manager.send_personal_message(json.dumps({
                "type": "error",
                "content": f"LangGraph execution error: {str(e)}"
            }), websocket)
