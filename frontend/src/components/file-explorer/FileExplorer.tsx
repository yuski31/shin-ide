import React, { useState, useEffect } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { FileNode } from '@shared/types';
import { 
  FolderIcon, 
  FolderOpenIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

interface FileExplorerProps {
  projectId: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ projectId }) => {
  const { 
    projectFiles, 
    currentFile, 
    openFile, 
    loadProjectFiles,
    createFile,
    deleteFile 
  } = useFileStore();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileNode;
  } | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectFiles(projectId);
    }
  }, [projectId, loadProjectFiles]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: FileNode) => {
    if (file.isDirectory) {
      toggleFolder(file.id);
    } else {
      openFile(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  const handleCreateFile = async () => {
    const fileName = prompt('Enter file name:');
    if (fileName && projectId) {
      try {
        await createFile(projectId, fileName);
        setContextMenu(null);
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  const handleDeleteFile = async (file: FileNode) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        await deleteFile(file.id);
        setContextMenu(null);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const getFileIcon = (file: FileNode) => {
    if (file.isDirectory) {
      return expandedFolders.has(file.id) ? FolderOpenIcon : FolderIcon;
    }
    return DocumentIcon;
  };

  const getFileTypeColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      'js': 'text-yellow-400',
      'jsx': 'text-blue-400',
      'ts': 'text-blue-500',
      'tsx': 'text-blue-500',
      'css': 'text-pink-400',
      'scss': 'text-pink-500',
      'html': 'text-orange-400',
      'json': 'text-green-400',
      'md': 'text-gray-400',
      'py': 'text-green-500',
      'vue': 'text-green-400',
    };
    return colorMap[ext || ''] || 'text-gray-400';
  };

  const buildFileTree = (files: FileNode[]): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const rootFiles: FileNode[] = [];

    // Create a map of all files
    files.forEach(file => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    // Build the tree structure
    files.forEach(file => {
      const fileNode = fileMap.get(file.id)!;
      if (file.parentId && fileMap.has(file.parentId)) {
        const parent = fileMap.get(file.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(fileNode);
      } else {
        rootFiles.push(fileNode);
      }
    });

    return rootFiles;
  };

  const renderFileNode = (file: FileNode, depth = 0): React.ReactNode => {
    const Icon = getFileIcon(file);
    const isExpanded = expandedFolders.has(file.id);
    const isSelected = currentFile?.id === file.id;

    return (
      <div key={file.id}>
        <div
          className={cn(
            'flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 rounded text-sm',
            isSelected && 'bg-gray-600',
            getFileTypeColor(file.name)
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          {file.isDirectory && (
            <span className="mr-1">
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </span>
          )}
          <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{file.name}</span>
        </div>
        
        {file.isDirectory && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree(projectFiles);

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Explorer</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCreateFile}
            className="p-1 hover:bg-gray-700 rounded"
            title="New File"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-700 rounded"
            title="More Actions"
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {fileTree.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <DocumentIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files in this project</p>
            <button
              onClick={handleCreateFile}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Create your first file
            </button>
          </div>
        ) : (
          fileTree.map(file => renderFileNode(file))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded shadow-lg py-1 min-w-[150px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
              onClick={handleCreateFile}
            >
              New File
            </button>
            <button
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
              onClick={() => {
                // TODO: Implement create folder
                setContextMenu(null);
              }}
            >
              New Folder
            </button>
            <hr className="border-gray-600 my-1" />
            <button
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm"
              onClick={() => {
                // TODO: Implement rename
                setContextMenu(null);
              }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm text-red-400"
              onClick={() => handleDeleteFile(contextMenu.file)}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileExplorer;
