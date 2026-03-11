import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
      } catch {
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

  firebaseLogin: (firebaseToken: string, username?: string) =>
    api.post<AuthResponse>('/auth/firebase', { firebaseToken, username }),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/reset-password', { email, token, newPassword, confirmPassword }),
};

// ===========================================
// Challenges API
// ===========================================
export const challengesApi = {
  getAll: (difficulty?: number, language?: number) =>
    api.get<import('@/types').ChallengeListItem[]>('/challenges', {
      params: { ...(difficulty && { difficulty }), ...(language && { language }) },
    }),

  getBySlug: (slug: string) =>
    api.get<import('@/types').ChallengeDetail>(`/challenges/${slug}`),

  test: (slug: string, code: string, language: number) =>
    api.post<import('@/types').JudgeResult>(`/challenges/${slug}/test`, { code, language }),

  submit: (slug: string, code: string, language: number) =>
    api.post<import('@/types').JudgeResult>(`/challenges/${slug}/submit`, { code, language }),

  getSubmissions: (slug: string) =>
    api.get<import('@/types').SubmissionInfo[]>(`/challenges/${slug}/submissions`),

  getLeaderboard: (period = 'all', page = 1, pageSize = 20) =>
    api.get<import('@/types').LeaderboardPage>('/leaderboard', { params: { period, page, pageSize } }),

  getDaily: () =>
    api.get<import('@/types').ChallengeListItem>('/challenges/daily'),

  // Admin
  adminGetAll: () =>
    api.get<import('@/types').ChallengeListItem[]>('/admin/challenges'),

  adminCreate: (data: import('@/types').CreateChallengeDto) =>
    api.post<import('@/types').ChallengeDetail>('/admin/challenges', data),

  adminUpdate: (id: string, data: Partial<import('@/types').CreateChallengeDto>) =>
    api.put<import('@/types').ChallengeDetail>(`/admin/challenges/${id}`, data),

  adminDelete: (id: string) =>
    api.delete(`/admin/challenges/${id}`),

  adminTogglePublish: (id: string) =>
    api.post<import('@/types').ChallengeDetail>(`/admin/challenges/${id}/publish`),

  adminSeed: () =>
    api.post<{ message: string }>('/admin/challenges/seed'),
};

// ===========================================
// Courses API
// ===========================================
export const coursesApi = {
  getAll: (language?: number) =>
    api.get<import('@/types').CourseListItem[]>('/courses', { params: language ? { language } : {} }),

  getBySlug: (slug: string) =>
    api.get<import('@/types').CourseDetail>(`/courses/${slug}`),

  // Admin
  adminGetAll: () =>
    api.get<import('@/types').CourseListItem[]>('/admin/courses'),

  adminCreate: (data: import('@/types').CreateCourseDto) =>
    api.post<import('@/types').CourseDetail>('/admin/courses', data),

  adminUpdate: (id: string, data: import('@/types').CreateCourseDto) =>
    api.put<import('@/types').CourseDetail>(`/admin/courses/${id}`, data),

  adminDelete: (id: string) =>
    api.delete(`/admin/courses/${id}`),

  adminTogglePublish: (id: string) =>
    api.post<import('@/types').CourseDetail>(`/admin/courses/${id}/publish`),
};

// ===========================================
// Admin Users API
// ===========================================
export const adminUsersApi = {
  getAll: () =>
    api.get<import('@/types').AdminUser[]>('/admin/users'),

  toggleAdmin: (id: string) =>
    api.post<import('@/types').AdminUser>(`/admin/users/${id}/toggle-admin`),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
};

// ===========================================
// VS Mode API
// ===========================================
export const vsApi = {
  getMyRank: () =>
    api.get<import('@/types').VsRank>('/vs/rank'),

  getRank: (userId: string) =>
    api.get<import('@/types').VsRank>(`/vs/rank/${userId}`),

  getLeaderboard: () =>
    api.get<import('@/types').VsLeaderboardEntry[]>('/vs/leaderboard'),

  getMatch: (matchId: string) =>
    api.get<import('@/types').VsMatch>(`/vs/matches/${matchId}`),

  getHistory: () =>
    api.get<import('@/types').VsMatch[]>('/vs/matches'),

  submit: (matchId: string, code: string, language: string) =>
    api.post<import('@/types').VsMatchResult>(`/vs/matches/${matchId}/submit`, { code, language }),

  forfeit: (matchId: string) =>
    api.post(`/vs/matches/${matchId}/forfeit`),
};

// ===========================================
// Profile API
// ===========================================
export const profileApi = {
  getMyProfile: () =>
    api.get<import('@/types').UserProfile>('/users/me/profile'),

  updateMyProfile: (data: import('@/types').UpdateProfileDto) =>
    api.put<import('@/types').UserProfile>('/users/me/profile', data),

  getPublicProfile: (username: string) =>
    api.get<import('@/types').PublicProfile>(`/users/public/${username}`),
};

// ===========================================
// Comments API
// ===========================================
export const commentsApi = {
  getComments: (slug: string) =>
    api.get<import('@/types').ChallengeComment[]>(`/challenges/${slug}/comments`),

  postComment: (slug: string, content: string, parentId?: string) =>
    api.post<import('@/types').ChallengeComment>(`/challenges/${slug}/comments`, { content, parentId }),

  deleteComment: (slug: string, id: string) =>
    api.delete(`/challenges/${slug}/comments/${id}`),
};

// ===========================================
// Formatting API
// ===========================================
export const formattingApi = {
  format: (code: string, language: string) =>
    api.post<{ formattedCode: string; success: boolean; error?: string }>('/format', { code, language }),
};

export default api;
