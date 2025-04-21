import { api } from '@/libs/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const findAllUsers = createAsyncThunk('users/find_all', async () => {
  const response = await api.get('/users/find_all');
  console.log(response.data)
  return response.data;
});

export const findOneUser = createAsyncThunk('users/find_one', async (id: string) => {
  const response = await api.get(`/users/find_one/${id}`);
  return response.data;
});

export const createOneUser = createAsyncThunk(
  'users/create_one',
  async (user: { name: string; email: string }) => {
    const response = await api.post('/users/create_one', user);
    return response.data;
  }
);

export const updateOneUser = createAsyncThunk(
  'users/update_one',
  async (user: { id: string; name: string; email: string }) => {
    const response = await api.put(`/users/update_one/${user.id}`, user);
    return response.data;
  }
);

export const removeOneUser = createAsyncThunk('users/remove_one', async (id: string) => {
  await api.delete(`/users/remove_one/${id}`);
  return id;
});
