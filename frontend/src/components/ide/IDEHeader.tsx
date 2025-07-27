import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import {
  HomeIcon,
  SparklesIcon,
  CommandLineIcon,
  Cog6ToothIcon,
  ShareIcon,
  PlayIcon,
  StopIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface IDEHeaderProps {
  project: Project;
  onToggleAIChat: () => void;
  onToggleTerminal: () => void;
  showAIChat: boolean;
  showTerminal: boolean;
}

const IDEHeader: React.FC<IDEHeaderProps> = ({
  project,
  onToggleAIChat,
  onToggleTerminal,
  showAIChat,
  showTerminal,
}) => {
  const { user } = useAuth();

  const handleSave = () => {
    // TODO: Implement save all files
    console.log('Save all files');
  };

  const handleRun = () => {
    // TODO: Implement run project
    console.log('Run project');
  };

  const handleShare = () => {
    // TODO: Implement share project
    console.log('Share project');
  };

  const handleSettings = () => {
    // TODO: Implement project settings
    console.log('Project settings');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 text-white">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Logo/Home */}
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 hover:bg-gray-700 px-2 py-1 rounded"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-medium">SHIN IDE</span>
          </Link>

          {/* Project Info */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400">/</span>
            <span className="font-medium">{project.name}</span>
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
              {project.framework}
            </span>
          </div>
        </div>

        {/* Center Section - Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="text-gray-300 hover:text-white"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-1" />
            Save
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className="text-green-400 hover:text-green-300"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Run
          </Button>

          <div className="h-4 w-px bg-gray-600" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTerminal}
            className={`${
              showTerminal 
                ? 'text-blue-400 bg-gray-700' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <CommandLineIcon className="h-4 w-4 mr-1" />
            Terminal
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAIChat}
            className={`${
              showAIChat 
                ? 'text-purple-400 bg-gray-700' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <SparklesIcon className="h-4 w-4 mr-1" />
            AI Chat
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Collaboration Status */}
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Online</span>
          </div>

          <div className="h-4 w-px bg-gray-600" />

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-gray-300 hover:text-white"
          >
            <ShareIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            className="text-gray-300 hover:text-white"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </Button>

          {/* User Info */}
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.firstName?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-300">{user?.firstName}</span>
          </div>
        </div>
      </div>

      {/* Secondary Bar - Breadcrumbs/Tabs */}
      <div className="bg-gray-900 px-4 py-1 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>Ready</span>
            <span>•</span>
            <span>Auto-save enabled</span>
            <span>•</span>
            <span>TypeScript</span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>Last saved: just now</span>
            <span>•</span>
            <span>Branch: main</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default IDEHeader;
