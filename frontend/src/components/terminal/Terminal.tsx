import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  XMarkIcon, 
  PlusIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  projectId: string;
}

interface TerminalTab {
  id: string;
  name: string;
  terminal: XTerm;
  fitAddon: FitAddon;
}

const Terminal: React.FC<TerminalProps> = ({ projectId }) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const { socket, isConnected } = useWebSocket();

  const createTerminal = () => {
    const terminalId = `terminal-${Date.now()}`;
    
    const terminal = new XTerm({
      theme: {
        background: '#1f2937',
        foreground: '#f9fafb',
        cursor: '#f9fafb',
        selection: '#374151',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#f9fafb',
        brightBlack: '#6b7280',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Handle terminal input
    terminal.onData((data) => {
      if (socket && isConnected) {
        socket.emit('terminal_input', {
          projectId,
          terminalId,
          data,
        });
      }
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      if (socket && isConnected) {
        socket.emit('terminal_resize', {
          projectId,
          terminalId,
          cols,
          rows,
        });
      }
    });

    const newTab: TerminalTab = {
      id: terminalId,
      name: `Terminal ${terminals.length + 1}`,
      terminal,
      fitAddon,
    };

    setTerminals(prev => [...prev, newTab]);
    setActiveTerminalId(terminalId);

    return newTab;
  };

  const closeTerminal = (terminalId: string) => {
    setTerminals(prev => {
      const updated = prev.filter(tab => tab.id !== terminalId);
      const terminalToClose = prev.find(tab => tab.id === terminalId);
      
      if (terminalToClose) {
        terminalToClose.terminal.dispose();
      }

      // If closing active terminal, switch to another one
      if (activeTerminalId === terminalId && updated.length > 0) {
        setActiveTerminalId(updated[0].id);
      } else if (updated.length === 0) {
        setActiveTerminalId(null);
      }

      return updated;
    });

    // Notify server about terminal closure
    if (socket && isConnected) {
      socket.emit('terminal_close', {
        projectId,
        terminalId,
      });
    }
  };

  const switchTerminal = (terminalId: string) => {
    setActiveTerminalId(terminalId);
  };

  // Initialize first terminal
  useEffect(() => {
    if (terminals.length === 0) {
      createTerminal();
    }
  }, []);

  // Mount active terminal
  useEffect(() => {
    if (!terminalContainerRef.current || !activeTerminalId) return;

    const activeTab = terminals.find(tab => tab.id === activeTerminalId);
    if (!activeTab) return;

    const container = terminalContainerRef.current;
    
    // Clear container
    container.innerHTML = '';
    
    // Mount terminal
    activeTab.terminal.open(container);
    
    // Fit terminal to container
    setTimeout(() => {
      activeTab.fitAddon.fit();
    }, 0);

    // Request terminal session from server
    if (socket && isConnected) {
      socket.emit('terminal_create', {
        projectId,
        terminalId: activeTerminalId,
        cols: activeTab.terminal.cols,
        rows: activeTab.terminal.rows,
      });
    }

    return () => {
      // Don't dispose terminal here, just detach
    };
  }, [activeTerminalId, terminals, socket, isConnected, projectId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const activeTab = terminals.find(tab => tab.id === activeTerminalId);
      if (activeTab) {
        setTimeout(() => {
          activeTab.fitAddon.fit();
        }, 0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTerminalId, terminals]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleTerminalOutput = (data: {
      terminalId: string;
      output: string;
    }) => {
      const terminal = terminals.find(tab => tab.id === data.terminalId);
      if (terminal) {
        terminal.terminal.write(data.output);
      }
    };

    const handleTerminalExit = (data: {
      terminalId: string;
      exitCode: number;
    }) => {
      const terminal = terminals.find(tab => tab.id === data.terminalId);
      if (terminal) {
        terminal.terminal.write(`\r\n\x1b[31mProcess exited with code ${data.exitCode}\x1b[0m\r\n`);
      }
    };

    socket.on('terminal_output', handleTerminalOutput);
    socket.on('terminal_exit', handleTerminalExit);

    return () => {
      socket.off('terminal_output', handleTerminalOutput);
      socket.off('terminal_exit', handleTerminalExit);
    };
  }, [socket, terminals]);

  const activeTab = terminals.find(tab => tab.id === activeTerminalId);

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Terminal Tabs */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700">
        <div className="flex-1 flex items-center overflow-x-auto">
          {terminals.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center px-3 py-2 text-sm border-r border-gray-700 cursor-pointer hover:bg-gray-700 ${
                activeTerminalId === tab.id ? 'bg-gray-700' : ''
              }`}
              onClick={() => switchTerminal(tab.id)}
            >
              <span className="mr-2">{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(tab.id);
                }}
                className="hover:bg-gray-600 rounded p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center px-2 space-x-1">
          <button
            onClick={createTerminal}
            className="p-1 hover:bg-gray-700 rounded"
            title="New Terminal"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-700 rounded"
            title="Terminal Settings"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {terminals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="mb-2">No terminal sessions</p>
              <button
                onClick={createTerminal}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Terminal
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={terminalContainerRef}
            className="absolute inset-0 p-2"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 px-3 py-1 text-xs text-gray-400 border-t border-gray-700">
        {activeTab && (
          <span>
            {activeTab.name} • {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Terminal;
