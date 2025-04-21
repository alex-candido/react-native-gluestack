import { createSlice } from '@reduxjs/toolkit';
import {
  createOneUser,
  findAllUsers,
  findOneUser,
  removeOneUser,
  updateOneUser,
} from '../actions/users-actions';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UsersState {
  list: User[];
  currentUser: User | null;
  error: boolean;
  loading: boolean;
  success: boolean;
  message: string | null;
}

const initialState: UsersState = {
  list: [],
  currentUser: null,
  error: false,
  loading: false,
  success: false,
  message: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // findAllUsers
      .addCase(findAllUsers.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.message = null;
      })
      .addCase(findAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.success = true;
      })
      .addCase(findAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.error.message || 'Erro ao buscar usuários.';
      })

      // findOneUser
      .addCase(findOneUser.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.message = null;
      })
      .addCase(findOneUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
      })
      .addCase(findOneUser.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.error.message || 'Erro ao buscar usuário.';
      })

      // createOneUser
      .addCase(createOneUser.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.success = true;
      })

      // updateOneUser
      .addCase(updateOneUser.fulfilled, (state, action) => {
        const index = state.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        state.success = true;
      })

      // removeOneUser
      .addCase(removeOneUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
        state.success = true;
      });
  },
});

export default usersSlice.reducer;
