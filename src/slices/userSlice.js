import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'users',
  initialState: {
    profile: {
      firstname: '',
      lastname:'',
      email: '',
      mobile: '',
      address: '',
      uid: '',
    },
  },
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    logout: (state) => {
      // Just clear the data here. Call signOut() in the component instead.
      state.profile = { firstname: '', lastname:'', email: '', mobile: '', address: '', uid: '' };
    },
  },
});

export const { setProfile, logout } = userSlice.actions;
export default userSlice.reducer;