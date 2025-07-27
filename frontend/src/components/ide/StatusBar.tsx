import React from 'react';
import { FileNode, Project } from '@shared/types';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface StatusBarProps {
  currentFile: FileNode | null;
  project: Project;
}

const StatusBar: React.FC<StatusBarProps> = ({ currentFile, project }) => {
  // Mock data - in real implementation, these would come from stores/services
  const diagnostics = {
    errors: 0,
    warnings: 2,
    info: 1,
  };

  const gitStatus = {
    branch: 'main',
    changes: 3,
    ahead: 0,
    behind: 0,
  };

  const getLanguageFromFile = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript React',
      'ts': 'TypeScript',
      'tsx': 'TypeScript React',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'md': 'Markdown',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
    };
    return languageMap[extension || ''] || 'Plain Text';
  };

  const getFileSize = (content: string): string => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 text-white text-xs">
      <div className="flex items-center justify-between px-4 py-1">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Git Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">
                {gitStatus.branch}
              </span>
            </div>
            {gitStatus.changes > 0 && (
              <span className="text-yellow-400">
                {gitStatus.changes} changes
              </span>
            )}
          </div>

          {/* Diagnostics */}
          <div className="flex items-center space-x-3">
            {diagnostics.errors > 0 && (
              <div className="flex items-center space-x-1 text-red-400">
                <XCircleIcon className="h-3 w-3" />
                <span>{diagnostics.errors}</span>
              </div>
            )}
            {diagnostics.warnings > 0 && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <ExclamationTriangleIcon className="h-3 w-3" />
                <span>{diagnostics.warnings}</span>
              </div>
            )}
            {diagnostics.info > 0 && (
              <div className="flex items-center space-x-1 text-blue-400">
                <InformationCircleIcon className="h-3 w-3" />
                <span>{diagnostics.info}</span>
              </div>
            )}
            {diagnostics.errors === 0 && diagnostics.warnings === 0 && (
              <div className="flex items-center space-x-1 text-green-400">
                <CheckCircleIcon className="h-3 w-3" />
                <span>No problems</span>
              </div>
            )}
          </div>

          {/* Server Status */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-400">Connected</span>
          </div>
        </div>

        {/* Center Section - Current File Info */}
        {currentFile && (
          <div className="flex items-center space-x-4 text-gray-400">
            <span>{currentFile.name}</span>
            <span>•</span>
            <span>{getLanguageFromFile(currentFile.name)}</span>
            <span>•</span>
            <span>{getFileSize(currentFile.content || '')}</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-4 text-gray-400">
          {/* Cursor Position */}
          {currentFile && (
            <span>Ln 1, Col 1</span>
          )}

          {/* Indentation */}
          <span>Spaces: 2</span>

          {/* Auto Save Status */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Auto Save</span>
          </div>

          {/* Encoding */}
          <span>UTF-8</span>

          {/* End of Line */}
          <span>LF</span>

          {/* Zoom Level */}
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
