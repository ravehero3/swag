import React, { useState, useEffect } from 'react';
import { Copy, X } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'log' | 'info';
  message: string;
}

export const AdminErrorLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const addLog = (level: 'error' | 'warn' | 'log' | 'info', message: string) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: String(message),
      };
      setLogs((prev) => [...prev, entry]);

      if (level === 'error') {
        setHasErrors(true);
      }
    };

    console.error = function (...args) {
      addLog('error', args.join(' '));
      originalError.apply(console, args as any);
    };

    console.warn = function (...args) {
      addLog('warn', args.join(' '));
      originalWarn.apply(console, args as any);
    };

    console.log = function (...args) {
      addLog('log', args.join(' '));
      originalLog.apply(console, args as any);
    };

    const handleError = (event: ErrorEvent) => {
      addLog('error', `${event.error?.message || 'Unknown Error'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Unhandled Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const copyLogs = () => {
    const text = logs
      .map((log) => `[${log.timestamp}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard');
  };

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-gray-950 border-t border-gray-800 flex items-center px-3 gap-2 text-xs z-30">
      <span className="text-gray-500">
        {logs.length} log{logs.length !== 1 ? 's' : ''}
        {hasErrors && <span className="ml-2 text-red-400">({logs.filter((l) => l.level === 'error').length} ❌)</span>}
      </span>
      <button
        onClick={copyLogs}
        className="ml-auto p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-gray-300"
        title="Copy all logs"
      >
        <Copy className="w-3 h-3" />
      </button>
      <button
        onClick={() => setLogs([])}
        className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-gray-300"
        title="Clear logs"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
