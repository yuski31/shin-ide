import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code, FileText, Bug, Zap, Settings } from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'error' | 'suggestion';
  metadata?: {
    language?: string;
    provider?: string;
    tokens?: number;
  };
}

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
}

export const EnhancedAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    chatCompletion, 
    generateCode, 
    explainCode, 
    debugCode, 
    optimizeCode,
    generateTests,
    generateDocumentation,
    availableProviders 
  } = useAIStore();
  
  const { currentProject } = useProjectStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setIsLoading(true);
    try {
      const response = await chatCompletion(
        [...messages, { role: 'user', content: userMessage, timestamp: new Date(), id: '' }],
        selectedProvider,
        conversationId || undefined,
        currentProject?.id
      );

      addMessage({
        role: 'assistant',
        content: response,
        metadata: {
          provider: selectedProvider,
        },
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        type: 'error',
      });
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions: AIAction[] = [
    {
      id: 'generate-code',
      label: 'Generate Code',
      icon: <Code className="w-4 h-4" />,
      description: 'Generate code from description',
      action: () => {
        setInput('Generate a React component that...');
        inputRef.current?.focus();
      },
    },
    {
      id: 'explain-code',
      label: 'Explain Code',
      icon: <FileText className="w-4 h-4" />,
      description: 'Explain selected code',
      action: () => {
        setInput('Explain this code: ');
        inputRef.current?.focus();
      },
    },
    {
      id: 'debug-code',
      label: 'Debug Code',
      icon: <Bug className="w-4 h-4" />,
      description: 'Debug and fix issues',
      action: () => {
        setInput('Help me debug this error: ');
        inputRef.current?.focus();
      },
    },
    {
      id: 'optimize-code',
      label: 'Optimize Code',
      icon: <Zap className="w-4 h-4" />,
      description: 'Optimize performance',
      action: () => {
        setInput('Optimize this code for better performance: ');
        inputRef.current?.focus();
      },
    },
  ];

  const formatMessage = (message: Message) => {
    if (message.type === 'code') {
      return (
        <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto">
          <code>{message.content}</code>
        </pre>
      );
    }
    
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {message.content.split('\n').map((line, index) => (
          <p key={index} className="mb-2 last:mb-0">
            {line}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {availableProviders.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={action.action}
              className="flex items-center gap-2 p-2 text-left text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={action.description}
            >
              {action.icon}
              <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium mb-2">AI Assistant Ready</p>
            <p className="text-sm">
              Ask me anything about your code, or use the quick actions above to get started.
            </p>
          </div>
        )}
        
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {formatMessage(message)}
              
              {message.metadata && (
                <div className="mt-2 text-xs opacity-70">
                  {message.metadata.provider && (
                    <span>via {message.metadata.provider}</span>
                  )}
                  {message.metadata.tokens && (
                    <span className="ml-2">{message.metadata.tokens} tokens</span>
                  )}
                </div>
              )}
            </div>
            
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI anything about your code..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
