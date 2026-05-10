import { FileNode, Language } from './types';

export const INITIAL_FILES: FileNode[] = [
  {
    id: 'root',
    name: 'nova-project',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        isOpen: true,
        children: [
          { id: 'main-ts', name: 'main.ts', type: 'file', language: 'typescript', content: `import { NovaCore } from './core/nova';
import { AgentOrchestrator } from './agents/orchestrator';

const nova = new NovaCore({
  model: 'gemini-2.0-flash',
  maxIterations: 50,
  enableSecurity: true,
  enablePerformance: true,
});

const orchestrator = new AgentOrchestrator(nova);

async function main() {
  console.log('Nova Core v1.0.0 — Multi-Agent IDE initialized.');
  await orchestrator.start();
}

main().catch(console.error);
` },
          { id: 'types-ts', name: 'types.ts', type: 'file', language: 'typescript', content: `export interface AgentConfig {
  id: string;
  name: string;
  role: 'coder' | 'researcher' | 'executor' | 'security' | 'performance';
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  assignedTo?: string;
  result?: string;
  createdAt: Date;
}

export interface WorkspaceState {
  activeFile: string | null;
  openTabs: string[];
  agentStatus: Record<string, 'idle' | 'working' | 'error'>;
}
` },
          {
            id: 'core',
            name: 'core',
            type: 'folder',
            isOpen: false,
            children: [
              { id: 'nova-ts', name: 'nova.ts', type: 'file', language: 'typescript', content: `export class NovaCore {
  constructor(private config: any) {}
  async execute(task: string): Promise<string> {
    return \`Task "\${task}" dispatched to agent swarm.\`;
  }
}
` },
            ]
          },
          {
            id: 'agents',
            name: 'agents',
            type: 'folder',
            isOpen: false,
            children: [
              { id: 'orch-ts', name: 'orchestrator.ts', type: 'file', language: 'typescript', content: `import { NovaCore } from '../core/nova';

export class AgentOrchestrator {
  constructor(private core: NovaCore) {}
  async start() {
    console.log('Agent orchestrator running...');
  }
}
` },
            ]
          }
        ]
      },
      { id: 'pkg', name: 'package.json', type: 'file', language: 'json', content: `{
  "name": "nova-project",
  "version": "1.0.0",
  "description": "A multi-agent AI development workspace",
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "langgraph": "^0.2.0",
    "langchain": "^0.3.0"
  }
}
` },
      { id: 'readme', name: 'README.md', type: 'file', language: 'markdown', content: `# Nova Project

A multi-agent AI-powered project, orchestrated by Nova Core.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Agent Architecture

- **Nova Core** — Central supervisor and orchestrator
- **Coder Agent** — Writes and refactors code
- **Researcher Agent** — Searches and synthesizes knowledge
- **Executor Agent** — Runs commands and manages devops
- **Security Agent** — Audits code for vulnerabilities
- **Performance Agent** — Profiles and optimizes
` },
      { id: 'tsconfig', name: 'tsconfig.json', type: 'file', language: 'json', content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
` },
    ]
  }
];

export const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3572A5',
  json: '#89e051',
  html: '#e34c26',
  css: '#563d7c',
  markdown: '#083fa1',
  rust: '#dea584',
  go: '#00ADD8',
  yaml: '#cb171e',
};

export const FILE_ICONS: Record<string, string> = {
  typescript: '📘',
  javascript: '📒',
  python: '🐍',
  json: '📋',
  html: '🌐',
  css: '🎨',
  markdown: '📝',
  rust: '🦀',
  go: '🐹',
  yaml: '⚙️',
  folder: '📁',
  'folder-open': '📂',
};
