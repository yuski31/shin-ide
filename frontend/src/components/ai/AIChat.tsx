import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AIChatProps {
  projectId: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ projectId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with code generation, debugging, explanations, and more. What would you like to work on?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // TODO: Implement actual AI API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `I understand you want help with: "${inputValue}". Here's what I can suggest:\n\n1. Let me analyze your current code structure\n2. I can help generate the necessary components\n3. We can implement best practices for your framework\n\nWould you like me to start with any specific part?`,
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat(aiResponse));
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('```')) {
          return null; // Handle code blocks separately
        }
        if (line.startsWith('# ')) {
          return <h3 key={index} className="text-lg font-bold mb-2">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={index} className="text-md font-semibold mb-1">{line.slice(3)}</h4>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={index} className="ml-4">{line.replace(/^\d+\. /, '')}</li>;
        }
        return <p key={index} className="mb-1">{line}</p>;
      })
      .filter(Boolean);
  };

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-purple-400" />
          <h3 className="text-sm font-medium">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">GPT-4</span>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="text-sm">
                  {formatMessage(message.content)}
                </div>
              )}
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-2 bg-gray-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <PhotoIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-300">{selectedImage.name}</span>
            </div>
            <button
              onClick={removeSelectedImage}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
            Explain code
          </button>
          <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
            Generate component
          </button>
          <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
            Fix bugs
          </button>
          <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
            Add tests
          </button>
        </div>

        {/* Input */}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your code..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Upload image"
            >
              <PhotoIcon className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Attach file"
            >
              <DocumentIcon className="h-4 w-4" />
            </button>
            <Button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !selectedImage) || isLoading}
              size="sm"
              className="p-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default AIChat;
