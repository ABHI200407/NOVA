# Anti-Gravity IDE (Nova) 🚀

![Anti-Gravity IDE](https://img.shields.io/badge/Status-Active-success.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.124-green.svg)

**Anti-Gravity IDE (Nova)** is a next-generation, browser-based Development Environment powered by a multi-agent AI architecture. It features floating, physics-based AI agent bubbles that assist you in real-time as you code.

## 🌟 Key Features

*   **Monaco Editor Integration:** Professional code editing experience powered by the same engine behind VS Code.
*   **Anti-Gravity Physics Engine:** Agent bubbles (Writer, Reviewer, DevOps) float on your screen, reacting dynamically to context and WebSocket events.
*   **LangGraph Orchestration:** A Python/FastAPI backend utilizing a `Supervisor` agent that delegates tasks to specialized nodes (`Coder`, `Researcher`, `Executor`).
*   **Persistent Vector Memory:** Uses **ChromaDB** to remember project context, architectural decisions, and user preferences across sessions.
*   **Deep Web Research:** Integrates **Tavily** API and **Playwright** for autonomous browsing of dynamic single-page applications.
*   **Secure Docker Execution:** The `Executor` agent runs terminal commands in an ephemeral, sandboxed Docker container.
*   **Observability:** Full LLM tracing and token usage monitoring via **LangFuse**.

---

## 🏗 Architecture

The repository is structured as a monorepo containing two main services:

1.  **`nova-core/`**: The FastAPI backend. Handles WebSocket streaming, LangGraph agent orchestration, Docker sandboxing, and ChromaDB persistence.
2.  **`nova-client/`**: The Next.js 15 frontend. Provides the Framer Motion physics engine, Monaco Editor, and real-time UI updates.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   Docker (Must be running for the Executor agent to run shell commands safely)

### 1. Backend Setup (`nova-core`)
Navigate to the backend directory and set up your Python virtual environment.

```bash
cd nova-core
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in `nova-core/` with your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_HOST=https://cloud.langfuse.com
```

**Run the Server:**
```bash
uvicorn main:app --reload
```
*The backend will start on `ws://127.0.0.1:8000/ws/chat`.*

### 2. Frontend Setup (`nova-client`)
Open a new terminal and navigate to the frontend directory.

```bash
cd nova-client
npm install
npm run dev
```
*The frontend will start on `http://localhost:3000`.*

---

## 🛠 Usage
1. Open `http://localhost:3000` in your browser.
2. You will see the Monaco editor and the floating agent bubbles.
3. Type instructions into the **Gravity Terminal** at the bottom.
4. Watch as the **Supervisor** delegates tasks, and the specific agent bubbles (Writer, Reviewer, DevOps) pulse when they are actively "thinking" or executing tools!

---

## 📄 License
This project is licensed under the MIT License.
