import apiClient from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from './apiClient';
import { ENDPOINTS } from '../constants/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.login, credentials);
  const { token, user } = response.data;
  // Persist JWT securely
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return response.data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>(ENDPOINTS.me);
  return response.data;
}
