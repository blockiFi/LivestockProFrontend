
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AuthState } from '@/lib/interfaces';
import type { Farm, FarmSubscriptionSummary, User } from '@/lib/types';
// Initial state


const initialState : AuthState  = {
  user  : null,
  token : '', 
  activeFarm : null, 
  permissions: [],
  permissionsLoaded: false,
  permissionsLoading: false,
  permissionsFarmId: null,
  subscription: null,
  subscriptionFarmId: null,
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
      state.authenticated = Boolean(action.payload);
    },
    setActiveFarm : (state , action : PayloadAction<Farm | null>) =>{
        const nextFarm = action.payload
        const farmChanged = state.activeFarm?.id !== nextFarm?.id
        state.activeFarm = nextFarm
        if (farmChanged) {
          state.permissions = []
          state.permissionsLoaded = false
          state.permissionsFarmId = null
          state.subscription = null
          state.subscriptionFarmId = null
        }
    },
    setSubscription: (state, action: PayloadAction<FarmSubscriptionSummary | null>) => {
      state.subscription = action.payload
      state.subscriptionFarmId = state.activeFarm?.id ?? null
    },
    setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
      state.permissionsLoading = action.payload
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload
      state.permissionsLoaded = true
      state.permissionsLoading = false
      state.permissionsFarmId = state.activeFarm?.id ?? null
    },
    logout: (state) => {
      state.user = null;
      state.token = "";
      state.activeFarm = null;
      state.permissions = [];
      state.permissionsLoaded = false;
      state.permissionsLoading = false;
      state.permissionsFarmId = null;
      state.subscription = null;
      state.subscriptionFarmId = null;
      state.authenticated = false;
    },
  },
});

// Export actions
export const { setUser, setToken , setActiveFarm, setPermissions, setPermissionsLoading, setSubscription, logout } = AuthenicationSlice.actions;

// Export the reducer to use in the store
export default AuthenicationSlice.reducer;