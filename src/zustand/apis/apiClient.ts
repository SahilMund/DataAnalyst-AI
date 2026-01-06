/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../apis/endPoints';
import { getUser } from '../../utils/localstorageUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = getUser();
  if (user && user.access_token) {
    headers['Authorization'] = `Bearer ${user.access_token}`;
  }

  return headers;
};

const createAxiosConfig = (additionalConfig: AxiosRequestConfig = {}): AxiosRequestConfig => {
  return {
    baseURL: API_BASE_URL,
    headers: getHeaders(),
    ...additionalConfig,
  };
};

const getAuthHeader = (token?: string): AxiosRequestConfig => {
  if (token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {};
};

export const get = async <T>(url: string): Promise<T> => {
  const user = getUser();
  const config = getAuthHeader(user?.access_token);
  const response = await apiClient.get<T>(url, createAxiosConfig(config));
  return response.data;
};

export const post = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const user = getUser();
  if (config) {
    config.headers["Authorization"] = user?.access_token;
  } else {
    config = getAuthHeader(user?.access_token);
  }
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(url: string, data: any, token?: string): Promise<T> => {
  const config = getAuthHeader(token);
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const del = async <T>(url: string, token?: string): Promise<T> => {
  const user = getUser();
  const config = getAuthHeader(user?.access_token || token);
  const response = await apiClient.delete<T>(url, createAxiosConfig(config));
  return response.data;
};

export const postStream = async <T>(
  url: string,
  data: any,
  onDataChunk: (chunk: any) => void
): Promise<T> => {
  const user = getUser();

  const streamConfig: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${user?.access_token}`,
      "Accept": "text/event-stream",
      "Cache-Control": "no-cache",
    },
    responseType: 'stream',
    onDownloadProgress: (progressEvent) => {
      const data = progressEvent.event.target.response;
      if (data && onDataChunk) {
        onDataChunk(data);
      }
    }
  };

  const response = await apiClient.post<T>(url, data, streamConfig);
  return response.data;
};