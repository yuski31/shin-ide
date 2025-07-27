import axios from 'axios';
import { FileNode, ApiResponse } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fileApi = axios.create({
  baseURL: `${API_BASE_URL}/files`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
fileApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const authData = JSON.parse(token);
      if (authData.state?.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${authData.state.tokens.accessToken}`;
      }
    } catch (error) {
      console.error('Failed to parse auth token:', error);
    }
  }
  return config;
});

export const fileService = {
  async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const response = await fileApi.get<ApiResponse<FileNode[]>>(`/project/${projectId}`);
    return response.data.data || [];
  },

  async getFile(fileId: string): Promise<FileNode> {
    const response = await fileApi.get<ApiResponse<FileNode>>(`/${fileId}`);
    return response.data.data!;
  },

  async getFileContent(fileId: string): Promise<string> {
    const response = await fileApi.get<ApiResponse<{ content: string }>>(`/${fileId}/content`);
    return response.data.data?.content || '';
  },

  async saveFile(fileId: string, content: string): Promise<void> {
    await fileApi.put(`/${fileId}/content`, { content });
  },

  async createFile(projectId: string, path: string, content = ''): Promise<FileNode> {
    const response = await fileApi.post<ApiResponse<FileNode>>('/', {
      projectId,
      path,
      content,
      type: 'file'
    });
    return response.data.data!;
  },

  async createDirectory(projectId: string, path: string): Promise<FileNode> {
    const response = await fileApi.post<ApiResponse<FileNode>>('/', {
      projectId,
      path,
      type: 'directory'
    });
    return response.data.data!;
  },

  async deleteFile(fileId: string): Promise<void> {
    await fileApi.delete(`/${fileId}`);
  },

  async renameFile(fileId: string, newName: string): Promise<FileNode> {
    const response = await fileApi.put<ApiResponse<FileNode>>(`/${fileId}/rename`, {
      name: newName
    });
    return response.data.data!;
  },

  async moveFile(fileId: string, newPath: string): Promise<FileNode> {
    const response = await fileApi.put<ApiResponse<FileNode>>(`/${fileId}/move`, {
      path: newPath
    });
    return response.data.data!;
  },

  async copyFile(fileId: string, newPath: string): Promise<FileNode> {
    const response = await fileApi.post<ApiResponse<FileNode>>(`/${fileId}/copy`, {
      path: newPath
    });
    return response.data.data!;
  },

  async uploadFile(projectId: string, path: string, file: File): Promise<FileNode> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('path', path);

    const response = await fileApi.post<ApiResponse<FileNode>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fileApi.get(`/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async searchFiles(projectId: string, query: string): Promise<FileNode[]> {
    const response = await fileApi.get<ApiResponse<FileNode[]>>(`/project/${projectId}/search`, {
      params: { q: query }
    });
    return response.data.data || [];
  },

  async getFileHistory(fileId: string): Promise<any[]> {
    const response = await fileApi.get<ApiResponse<any[]>>(`/${fileId}/history`);
    return response.data.data || [];
  },

  async restoreFileVersion(fileId: string, versionId: string): Promise<FileNode> {
    const response = await fileApi.post<ApiResponse<FileNode>>(`/${fileId}/restore/${versionId}`);
    return response.data.data!;
  },
};
