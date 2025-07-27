import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from '@/hooks/useTheme';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FILE_EXTENSIONS } from '@shared/constants';
import type { EditorState, EditorChange } from '@shared/types';

interface MonacoEditorProps {
  value: string;
  language: string;
  path: string;
  projectId: string;
  onChange?: (value: string, changes: EditorChange[]) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export default function MonacoEditor({
  value,
  language,
  path,
  projectId,
  onChange,
  onSave,
  readOnly = false,
  className = '',
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();
  const { socket } = useWebSocket();
  const [isReady, setIsReady] = useState(false);

  // Get language from file extension if not provided
  const detectedLanguage = language || getLanguageFromPath(path);

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    setIsReady(true);

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      lineHeight: 1.6,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showClasses: true,
        showFunctions: true,
        showVariables: true,
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
      }
    });

    // Add TypeScript/JavaScript specific configurations
    if (detectedLanguage === 'typescript' || detectedLanguage === 'javascript') {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
      });

      // Add React types
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `
        declare module 'react' {
          export = React;
          export as namespace React;
          namespace React {
            interface Component<P = {}, S = {}> {}
            interface FunctionComponent<P = {}> {}
            type FC<P = {}> = FunctionComponent<P>;
          }
        }
        `,
        'file:///node_modules/@types/react/index.d.ts'
      );
    }

    // Handle cursor position changes for collaboration
    editor.onDidChangeCursorPosition((e) => {
      if (socket && projectId) {
        socket.emit('cursor_move', {
          projectId,
          path,
          position: {
            line: e.position.lineNumber,
            column: e.position.column,
          },
        });
      }
    });

    // Handle selection changes
    editor.onDidChangeCursorSelection((e) => {
      if (socket && projectId && !e.selection.isEmpty()) {
        socket.emit('selection_change', {
          projectId,
          path,
          selection: {
            start: {
              line: e.selection.startLineNumber,
              column: e.selection.startColumn,
            },
            end: {
              line: e.selection.endLineNumber,
              column: e.selection.endColumn,
            },
          },
        });
      }
    });
  }, [detectedLanguage, onSave, socket, projectId, path]);

  // Handle content changes
  const handleEditorChange: OnChange = useCallback((value, event) => {
    if (!value || !onChange || !event) return;

    const changes: EditorChange[] = event.changes.map((change) => ({
      range: {
        startLineNumber: change.range.startLineNumber,
        startColumn: change.range.startColumn,
        endLineNumber: change.range.endLineNumber,
        endColumn: change.range.endColumn,
      },
      text: change.text,
      rangeLength: change.rangeLength,
    }));

    onChange(value, changes);

    // Emit changes for real-time collaboration
    if (socket && projectId) {
      socket.emit('text_change', {
        projectId,
        path,
        changes,
        content: value,
      });
    }
  }, [onChange, socket, projectId, path]);

  // Listen for remote changes
  useEffect(() => {
    if (!socket || !isReady || !editorRef.current) return;

    const handleRemoteChange = (data: {
      path: string;
      changes: EditorChange[];
      userId: string;
    }) => {
      if (data.path !== path || !editorRef.current) return;

      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;

      // Apply remote changes
      const edits = data.changes.map((change) => ({
        range: new monaco.Range(
          change.range.startLineNumber,
          change.range.startColumn,
          change.range.endLineNumber,
          change.range.endColumn
        ),
        text: change.text,
      }));

      model.pushEditOperations([], edits, () => null);
    };

    const handleRemoteCursor = (data: {
      path: string;
      userId: string;
      position: { line: number; column: number };
    }) => {
      if (data.path !== path || !editorRef.current) return;

      // Show remote cursor (implement cursor decoration)
      // This would require additional implementation for visual cursors
    };

    socket.on('remote_text_change', handleRemoteChange);
    socket.on('remote_cursor_move', handleRemoteCursor);

    return () => {
      socket.off('remote_text_change', handleRemoteChange);
      socket.off('remote_cursor_move', handleRemoteCursor);
    };
  }, [socket, isReady, path]);

  // Focus editor when component mounts
  useEffect(() => {
    if (isReady && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isReady]);

  return (
    <div className={`h-full w-full ${className}`}>
      <Editor
        height="100%"
        language={detectedLanguage}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          readOnly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      />
    </div>
  );
}

// Helper function to detect language from file path
function getLanguageFromPath(path: string): string {
  const extension = path.substring(path.lastIndexOf('.'));
  return FILE_EXTENSIONS[extension as keyof typeof FILE_EXTENSIONS] || 'plaintext';
}
