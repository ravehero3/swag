import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X, Copy } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'log' | 'info';
  message: string;
}

export const AdminErrorLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
      setLogs((prev) => [...prev, entry].slice(-100)); // Keep last 100 logs

      if (level === 'error') {
        setIsExpanded(true);
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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyLogs = () => {
    const text = logs
      .map((log) => `[${log.timestamp}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const levelColors = {
    error: 'text-red-400',
    warn: 'text-yellow-400',
    log: 'text-gray-400',
    info: 'text-blue-400',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 bg-gray-900 cursor-pointer hover:bg-gray-800 transition text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-400">
          Error Log ({logs.length})
          {logs.some((l) => l.level === 'error') && (
            <span className="ml-2 text-red-400">({logs.filter((l) => l.level === 'error').length} errors)</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyLogs();
            }}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-300"
            title="Copy all logs"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLogs([]);
            }}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-300"
            title="Clear logs"
          >
            <X className="w-3 h-3" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronUp className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>

      {/* Logs Container */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto bg-black bg-opacity-50">
          {logs.length === 0 ? (
            <div className="p-2 text-center text-gray-500 text-xs">No logs</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`px-2 py-1 border-b border-gray-800 text-xs font-mono ${levelColors[log.level]}`}
              >
                <div className="flex gap-2">
                  <span className="text-gray-600">[{log.timestamp}]</span>
                  <span className="break-words flex-1">{log.message}</span>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
};
