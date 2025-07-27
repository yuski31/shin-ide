import { create } from 'zustand';
import { FileNode } from '@shared/types';
import { fileService } from '@/services/fileService';

interface FileState {
  currentFile: FileNode | null;
  openFiles: FileNode[];
  projectFiles: FileNode[];
  isFilesLoading: boolean;
}

interface FileActions {
  setCurrentFile: (file: FileNode | null) => void;
  setOpenFiles: (files: FileNode[]) => void;
  setProjectFiles: (files: FileNode[]) => void;
  setFilesLoading: (loading: boolean) => void;
  loadProjectFiles: (projectId: string) => Promise<void>;
  openFile: (file: FileNode) => void;
  closeFile: (fileId: string) => void;
  saveFile: (file: FileNode, content: string) => Promise<void>;
  createFile: (projectId: string, path: string, content?: string) => Promise<FileNode>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  updateFileContent: (fileId: string, content: string) => void;
}

type FileStore = FileState & FileActions;

export const useFileStore = create<FileStore>((set, get) => ({
  // State
  currentFile: null,
  openFiles: [],
  projectFiles: [],
  isFilesLoading: false,

  // Actions
  setCurrentFile: (file) => set({ currentFile: file }),
  
  setOpenFiles: (openFiles) => set({ openFiles }),
  
  setProjectFiles: (projectFiles) => set({ projectFiles }),
  
  setFilesLoading: (isFilesLoading) => set({ isFilesLoading }),

  loadProjectFiles: async (projectId: string) => {
    try {
      set({ isFilesLoading: true });
      const files = await fileService.getProjectFiles(projectId);
      set({ projectFiles: files });
    } catch (error) {
      console.error('Failed to load project files:', error);
      throw error;
    } finally {
      set({ isFilesLoading: false });
    }
  },

  openFile: (file: FileNode) => {
    const { openFiles } = get();
    
    // Check if file is already open
    const isAlreadyOpen = openFiles.some(f => f.id === file.id);
    
    if (!isAlreadyOpen) {
      set({ 
        openFiles: [...openFiles, file],
        currentFile: file 
      });
    } else {
      set({ currentFile: file });
    }
  },

  closeFile: (fileId: string) => {
    const { openFiles, currentFile } = get();
    const updatedOpenFiles = openFiles.filter(f => f.id !== fileId);
    
    let newCurrentFile = currentFile;
    
    // If closing the current file, switch to another open file
    if (currentFile?.id === fileId) {
      newCurrentFile = updatedOpenFiles.length > 0 
        ? updatedOpenFiles[updatedOpenFiles.length - 1] 
        : null;
    }
    
    set({ 
      openFiles: updatedOpenFiles,
      currentFile: newCurrentFile 
    });
  },

  saveFile: async (file: FileNode, content: string) => {
    try {
      await fileService.saveFile(file.id, content);
      
      // Update file content in stores
      const { openFiles, projectFiles, currentFile } = get();
      
      const updateFileInArray = (files: FileNode[]) =>
        files.map(f => f.id === file.id ? { ...f, content } : f);
      
      set({
        openFiles: updateFileInArray(openFiles),
        projectFiles: updateFileInArray(projectFiles),
        currentFile: currentFile?.id === file.id 
          ? { ...currentFile, content } 
          : currentFile
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  },

  createFile: async (projectId: string, path: string, content = '') => {
    try {
      const newFile = await fileService.createFile(projectId, path, content);
      const { projectFiles } = get();
      
      set({ projectFiles: [...projectFiles, newFile] });
      return newFile;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      const { openFiles, projectFiles, currentFile } = get();
      
      // Remove from all stores
      const filteredOpenFiles = openFiles.filter(f => f.id !== fileId);
      const filteredProjectFiles = projectFiles.filter(f => f.id !== fileId);
      
      let newCurrentFile = currentFile;
      if (currentFile?.id === fileId) {
        newCurrentFile = filteredOpenFiles.length > 0 
          ? filteredOpenFiles[filteredOpenFiles.length - 1] 
          : null;
      }
      
      set({
        openFiles: filteredOpenFiles,
        projectFiles: filteredProjectFiles,
        currentFile: newCurrentFile
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    try {
      const updatedFile = await fileService.renameFile(fileId, newName);
      const { openFiles, projectFiles, currentFile } = get();
      
      const updateFileInArray = (files: FileNode[]) =>
        files.map(f => f.id === fileId ? updatedFile : f);
      
      set({
        openFiles: updateFileInArray(openFiles),
        projectFiles: updateFileInArray(projectFiles),
        currentFile: currentFile?.id === fileId ? updatedFile : currentFile
      });
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  },

  updateFileContent: (fileId: string, content: string) => {
    const { openFiles, currentFile } = get();
    
    const updateFileInArray = (files: FileNode[]) =>
      files.map(f => f.id === fileId ? { ...f, content } : f);
    
    set({
      openFiles: updateFileInArray(openFiles),
      currentFile: currentFile?.id === fileId 
        ? { ...currentFile, content } 
        : currentFile
    });
  },
}));
