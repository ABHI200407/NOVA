import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../components/types';

let msgId = 0;
const mkMsg = (d: Partial<Message>): Message => ({
  id: String(++msgId), timestamp: new Date(),
  role: 'agent', type: 'message', content: '', ...d,
});

export function useWebSocket() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const agentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      setStatus('connecting');
      try {
        const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat');
        wsRef.current = ws;

        ws.onopen = () => {
          if (destroyed) { ws.close(); return; }
          setStatus('connected');
          retriesRef.current = 0;
          addMessage(mkMsg({ type: 'info', content: 'Nova Core connected. All agents online.', role: 'system', agentId: 'Supervisor' }));
        };

        ws.onmessage = (e) => {
          if (destroyed) return;
          try {
            const data = JSON.parse(e.data);
            addMessage(mkMsg(data));
            if (data.agentId) {
              setActiveAgent(data.agentId);
              if (agentTimerRef.current) clearTimeout(agentTimerRef.current);
              agentTimerRef.current = setTimeout(() => setActiveAgent(null), 3500);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (destroyed) return;
          setStatus('disconnected');
          wsRef.current = null;
          const delay = Math.min(30000, 1500 * Math.pow(1.5, retriesRef.current));
          retriesRef.current++;
          setTimeout(connect, delay);
        };

        ws.onerror = () => { ws.close(); };
      } catch {
        setStatus('disconnected');
        setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      destroyed = true;
      if (agentTimerRef.current) clearTimeout(agentTimerRef.current);
      wsRef.current?.close();
    };
  }, [addMessage]);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendMessage = useCallback((content: string) => {
    const userMsg = mkMsg({ role: 'user', type: 'message', content });
    addMessage(userMsg);
    const sent = send({ type: 'message', content });
    if (!sent) {
      setTimeout(() => addMessage(mkMsg({
        role: 'system', type: 'info',
        content: '⚠ Backend offline. Start nova-core to connect agents.',
      })), 300);
    }
  }, [send, addMessage]);

  const approve = useCallback((msgIdx: number, approved: boolean) => {
    const resp = approved ? 'User approved.' : 'User rejected.';
    setMessages(prev => {
      const next = [...prev];
      next[msgIdx] = { ...next[msgIdx], status: approved ? 'approved' : 'rejected' };
      next.push(mkMsg({ role: 'user', type: 'message', content: resp }));
      return next;
    });
    send({ type: 'approval', content: resp });
  }, [send]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { status, messages, activeAgent, sendMessage, approve, clearMessages, send };
}
