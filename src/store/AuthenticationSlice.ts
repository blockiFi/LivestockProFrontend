
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AuthState } from '@/lib/interfaces';
import type { Farm, User } from '@/lib/types';
// Initial state


const initialState : AuthState  = {
  user  : null,
  token : '', 
  activeFarm : null, 
  authenticated : false
};

// Create a slice
const AuthenicationSlice = createSlice({
  name: 'authenticaton',
  initialState,
  reducers: {
    setUser: (state , action : PayloadAction<User | null> ) => {
      state.user =  action.payload;
    },
    setToken: (state , action : PayloadAction<string>) => {
      state.token = action.payload;
      state.authenticated = true;
    },
    setActiveFarm : (state , action : PayloadAction<Farm>) =>{
        state.activeFarm = action.payload;
    }
  },
});

// Export actions
export const { setUser, setToken , setActiveFarm } = AuthenicationSlice.actions;

// Export the reducer to use in the store
export default AuthenicationSlice.reducer;