import axios from 'axios';
import { Project, ApiResponse, PaginatedResponse } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const projectApi = axios.create({
  baseURL: `${API_BASE_URL}/projects`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
projectApi.interceptors.request.use((config) => {
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

export const projectService = {
  async getProjects(page = 1, limit = 20): Promise<Project[]> {
    const response = await projectApi.get<PaginatedResponse<Project>>('/', {
      params: { page, limit }
    });
    return response.data.data || [];
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await projectApi.get<ApiResponse<Project>>(`/${projectId}`);
    return response.data.data!;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await projectApi.post<ApiResponse<Project>>('/', projectData);
    return response.data.data!;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const response = await projectApi.put<ApiResponse<Project>>(`/${projectId}`, updates);
    return response.data.data!;
  },

  async deleteProject(projectId: string): Promise<void> {
    await projectApi.delete(`/${projectId}`);
  },

  async duplicateProject(projectId: string, newName: string): Promise<Project> {
    const response = await projectApi.post<ApiResponse<Project>>(`/${projectId}/duplicate`, {
      name: newName
    });
    return response.data.data!;
  },

  async shareProject(projectId: string, email: string, role: string): Promise<void> {
    await projectApi.post(`/${projectId}/share`, { email, role });
  },

  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    await projectApi.delete(`/${projectId}/collaborators/${userId}`);
  },

  async updateProjectSettings(projectId: string, settings: any): Promise<Project> {
    const response = await projectApi.put<ApiResponse<Project>>(`/${projectId}/settings`, settings);
    return response.data.data!;
  },

  async getProjectTemplates(): Promise<any[]> {
    const response = await projectApi.get<ApiResponse<any[]>>('/templates');
    return response.data.data || [];
  },

  async createFromTemplate(templateId: string, projectName: string): Promise<Project> {
    const response = await projectApi.post<ApiResponse<Project>>('/from-template', {
      templateId,
      name: projectName
    });
    return response.data.data!;
  },

  async exportProject(projectId: string): Promise<Blob> {
    const response = await projectApi.get(`/${projectId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async importProject(file: File): Promise<Project> {
    const formData = new FormData();
    formData.append('project', file);
    
    const response = await projectApi.post<ApiResponse<Project>>('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },
};
