import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'log' | 'info';
  message: string;
  source?: string;
  stack?: string;
}

export const AdminErrorLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Override console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;

    const addLog = (level: 'error' | 'warn' | 'log' | 'info', message: string) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: String(message),
      };
      setLogs((prev) => [...prev, entry].slice(-50)); // Keep last 50 logs

      // Auto-expand on error
      if (level === 'error') {
        setIsExpanded(true);
        setIsCollapsed(false);
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

    console.info = function (...args) {
      addLog('info', args.join(' '));
      originalInfo.apply(console, args as any);
    };

    console.log = function (...args) {
      addLog('log', args.join(' '));
      originalLog.apply(console, args as any);
    };

    // Capture uncaught errors
    const handleError = (event: ErrorEvent) => {
      addLog('error', `${event.error?.message || 'Unknown Error'} at ${event.filename}:${event.lineno}`);
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
      console.info = originalInfo;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const levelColors = {
    error: 'text-red-400 bg-red-900 bg-opacity-20',
    warn: 'text-yellow-400 bg-yellow-900 bg-opacity-20',
    log: 'text-gray-400 bg-gray-900 bg-opacity-20',
    info: 'text-blue-400 bg-blue-900 bg-opacity-20',
  };

  const levelIcons = {
    error: '❌',
    warn: '⚠️',
    log: '📝',
    info: 'ℹ️',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer hover:bg-gray-800 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {logs.some((l) => l.level === 'error') && (
            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
          )}
          <span className="text-sm font-semibold text-gray-300">
            Admin Error Log ({logs.length})
          </span>
          {logs.filter((l) => l.level === 'error').length > 0 && (
            <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded">
              {logs.filter((l) => l.level === 'error').length} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLogs([]);
            }}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-300"
            title="Clear logs"
          >
            <X className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Logs Container */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto bg-black bg-opacity-50">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No logs yet</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`px-3 py-2 border-b border-gray-800 text-xs ${levelColors[log.level]} font-mono`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6">{levelIcons[log.level]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-500">[{log.timestamp}]</div>
                    <div className="break-words">{log.message}</div>
                  </div>
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
