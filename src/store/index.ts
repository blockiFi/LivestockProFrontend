import { configureStore } from '@reduxjs/toolkit';
import AuthenticationReducer from './AuthenticationSlice.js';
import StatisticsReducer from './StatisticsSlice.js'
// Configure the store
const store = configureStore({
  reducer: {
    authentication: AuthenticationReducer,
    statistics : StatisticsReducer
    
  },
});
export type RootState = ReturnType<typeof store.getState>;

export default store;