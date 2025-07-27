import { create } from 'zustand';
import { Project } from '@shared/types';
import { projectService } from '@/services/projectService';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isProjectLoading: boolean;
  isProjectsLoading: boolean;
}

interface ProjectActions {
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setProjectLoading: (loading: boolean) => void;
  setProjectsLoading: (loading: boolean) => void;
  loadProject: (projectId: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // State
  currentProject: null,
  projects: [],
  isProjectLoading: false,
  isProjectsLoading: false,

  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),
  
  setProjects: (projects) => set({ projects }),
  
  setProjectLoading: (isProjectLoading) => set({ isProjectLoading }),
  
  setProjectsLoading: (isProjectsLoading) => set({ isProjectsLoading }),

  loadProject: async (projectId: string) => {
    try {
      set({ isProjectLoading: true });
      const project = await projectService.getProject(projectId);
      set({ currentProject: project });
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    } finally {
      set({ isProjectLoading: false });
    }
  },

  loadProjects: async () => {
    try {
      set({ isProjectsLoading: true });
      const projects = await projectService.getProjects();
      set({ projects });
    } catch (error) {
      console.error('Failed to load projects:', error);
      throw error;
    } finally {
      set({ isProjectsLoading: false });
    }
  },

  createProject: async (projectData: Partial<Project>) => {
    try {
      const project = await projectService.createProject(projectData);
      const { projects } = get();
      set({ projects: [...projects, project] });
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  updateProject: async (projectId: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectService.updateProject(projectId, updates);
      const { projects, currentProject } = get();
      
      // Update projects list
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      );
      set({ projects: updatedProjects });
      
      // Update current project if it's the one being updated
      if (currentProject?.id === projectId) {
        set({ currentProject: updatedProject });
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      const { projects, currentProject } = get();
      
      // Remove from projects list
      const filteredProjects = projects.filter(p => p.id !== projectId);
      set({ projects: filteredProjects });
      
      // Clear current project if it's the one being deleted
      if (currentProject?.id === projectId) {
        set({ currentProject: null });
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },
}));
