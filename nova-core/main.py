from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from schema import AgentMessage, ClientMessage
import json
import asyncio

app = FastAPI(title="Nova Core AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Nova Core is running"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Instantiate the agent once per connection
        # Requires valid GEMINI_API_KEY in environment or passed via settings
        from agent import NovaMultiAgent
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        agent = NovaMultiAgent(model_name="gemini/gemini-1.5-pro", api_key=api_key)

        while True:
            data = await websocket.receive_text()
            try:
                client_msg = ClientMessage.model_validate_json(data)
                
                # Run the actual agent loop asynchronously
                import asyncio
                asyncio.create_task(agent.run_step(client_msg.content, manager, websocket))

            except Exception as e:
                error_msg = AgentMessage(type="error", content=str(e))
                await manager.send_personal_message(error_msg.model_dump_json(), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
