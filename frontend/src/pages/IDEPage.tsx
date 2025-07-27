import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MonacoEditor from '@/components/editor/MonacoEditor';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import Terminal from '@/components/terminal/Terminal';
import AIChat from '@/components/ai/AIChat';
import IDEHeader from '@/components/ide/IDEHeader';
import StatusBar from '@/components/ide/StatusBar';
import { useProjectStore } from '@/store/useProjectStore';
import { useFileStore } from '@/store/useFileStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const IDEPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  
  const { 
    currentProject, 
    loadProject, 
    isProjectLoading 
  } = useProjectStore();
  
  const { 
    currentFile, 
    openFiles, 
    loadProjectFiles 
  } = useFileStore();

  useEffect(() => {
    const initializeIDE = async () => {
      if (projectId) {
        try {
          setIsLoading(true);
          await loadProject(projectId);
          await loadProjectFiles(projectId);
        } catch (error) {
          console.error('Failed to initialize IDE:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeIDE();
  }, [projectId, loadProject, loadProjectFiles]);

  if (isLoading || isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">Loading IDE...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <p className="text-gray-400">The requested project could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* IDE Header */}
      <IDEHeader 
        project={currentProject}
        onToggleAIChat={() => setShowAIChat(!showAIChat)}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        showAIChat={showAIChat}
        showTerminal={showTerminal}
      />

      {/* Main IDE Layout */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <FileExplorer projectId={projectId!} />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
          
          {/* Editor Area */}
          <Panel defaultSize={showAIChat ? 50 : 80}>
            <PanelGroup direction="vertical">
              {/* Code Editor */}
              <Panel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                <div className="h-full flex flex-col">
                  {/* Editor Tabs */}
                  {openFiles.length > 0 && (
                    <div className="flex bg-gray-800 border-b border-gray-700">
                      {openFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`px-4 py-2 text-sm border-r border-gray-700 cursor-pointer hover:bg-gray-700 ${
                            currentFile?.id === file.id 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-400'
                          }`}
                        >
                          {file.name}
                          <button className="ml-2 hover:text-white">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Monaco Editor */}
                  <div className="flex-1">
                    {currentFile ? (
                      <MonacoEditor
                        file={currentFile}
                        theme="vs-dark"
                        options={{
                          fontSize: 14,
                          tabSize: 2,
                          insertSpaces: true,
                          wordWrap: 'on',
                          minimap: { enabled: true },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-300 mb-2">
                            Welcome to SHIN IDE
                          </h3>
                          <p className="text-gray-500">
                            Select a file from the explorer to start editing
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              
              {/* Terminal */}
              {showTerminal && (
                <>
                  <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
                  <Panel defaultSize={30} minSize={20} maxSize={50}>
                    <Terminal projectId={projectId!} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          
          {/* AI Chat Panel */}
          {showAIChat && (
            <>
              <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
              <Panel defaultSize={30} minSize={25} maxSize={40}>
                <AIChat projectId={projectId!} />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar 
        currentFile={currentFile}
        project={currentProject}
      />
    </div>
  );
};

export default IDEPage;
