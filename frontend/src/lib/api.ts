import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, ApiError } from '@/types';

// ===========================================
// Configuration de l'API Client
// ===========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas encore retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<AuthResponse>(
            `${API_URL}/api/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ===========================================
// Auth API
// ===========================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, username, password }),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
};

// ===========================================
// Projects API
// ===========================================
export const projectsApi = {
  getMyProjects: () =>
    api.get<import('@/types').ProjectListItem[]>('/projects'),

  getPublicProjects: (page = 1, pageSize = 10) =>
    api.get<import('@/types').PagedResult<import('@/types').ProjectListItem>>(
      `/projects/public?page=${page}&pageSize=${pageSize}`
    ),

  getById: (id: string) =>
    api.get<import('@/types').Project>(`/projects/${id}`),

  create: (data: import('@/types').CreateProjectDto) =>
    api.post<import('@/types').Project>('/projects', data),

  update: (id: string, data: Partial<import('@/types').CreateProjectDto>) =>
    api.put<import('@/types').Project>(`/projects/${id}`, data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),

  duplicate: (id: string, newName?: string) =>
    api.post<import('@/types').Project>(`/projects/${id}/duplicate`, { newName }),
};

// ===========================================
// Files API
// ===========================================
export const filesApi = {
  getProjectFiles: (projectId: string) =>
    api.get<import('@/types').CodeFile[]>(`/Files/project/${projectId}/tree`),

  getFile: (_projectId: string, fileId: string) =>
    api.get<import('@/types').CodeFile>(`/Files/${fileId}`),

  create: (projectId: string, data: import('@/types').CreateFileDto) =>
    api.post<import('@/types').CodeFile>(`/Files/project/${projectId}`, data),

  update: (_projectId: string, fileId: string, content: string) =>
    api.put<import('@/types').CodeFile>(`/Files/${fileId}/content`, { content }),

  rename: (_projectId: string, fileId: string, name: string) =>
    api.put<import('@/types').CodeFile>(`/Files/${fileId}/rename`, { name }),

  delete: (_projectId: string, fileId: string) =>
    api.delete(`/Files/${fileId}`),

  downloadProject: async (projectId: string, projectName: string) => {
    const response = await api.get(`/Files/project/${projectId}/download`, {
      responseType: 'blob',
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectName}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ===========================================
// Execution API
// ===========================================
export const executionApi = {
  run: (projectId: string, fileId: string, code: string, language: number, input?: string) =>
    api.post<import('@/types').ExecutionResult>(`/execution/run`, {
      projectId,
      fileId,
      code,
      language,
      input
    }),
};

// ===========================================
// Collaborations API
// ===========================================
export const collaborationsApi = {
  getCollaborators: (projectId: string) =>
    api.get<import('@/types').Collaborator[]>(`/collaborations/project/${projectId}`),

  invite: (projectId: string, email: string, role: import('@/types').CollaboratorRole) =>
    api.post<import('@/types').Collaborator>(`/collaborations/project/${projectId}/invite`, { email, role }),

  updateRole: (projectId: string, userId: string, role: import('@/types').CollaboratorRole) =>
    api.put<import('@/types').Collaborator>(`/collaborations/project/${projectId}/user/${userId}`, { role }),

  remove: (projectId: string, userId: string) =>
    api.delete(`/collaborations/project/${projectId}/user/${userId}`),

  // Get pending invitations for current user
  getPendingInvitations: () =>
    api.get<import('@/types').Collaborator[]>(`/collaborations/invitations`),

  // Accept invitation
  acceptInvitation: (collaborationId: string) =>
    api.post(`/collaborations/invitations/${collaborationId}/accept`),

  // Decline invitation
  declineInvitation: (collaborationId: string) =>
    api.post(`/collaborations/invitations/${collaborationId}/decline`),

  // Leave project
  leaveProject: (projectId: string) =>
    api.post(`/collaborations/project/${projectId}/leave`),
};

// ===========================================
// Dependencies API
// ===========================================
export const dependenciesApi = {
  getProjectDependencies: (projectId: string) =>
    api.get<import('@/types').ProjectDependencies>(`/dependencies/project/${projectId}`),

  add: (projectId: string, data: import('@/types').AddDependencyDto) =>
    api.post<import('@/types').Dependency>(`/dependencies/project/${projectId}`, data),

  remove: (projectId: string, dependencyId: string) =>
    api.delete(`/dependencies/project/${projectId}/${dependencyId}`),
};

export default api;
