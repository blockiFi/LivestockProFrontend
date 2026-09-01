
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PoultryDashboardData } from '@/lib/types';
// Initial state
interface StatisticSliceDataType {
    poultryStatistics : PoultryDashboardData | null,

}

const initialState : StatisticSliceDataType  = {
  poultryStatistics  : null,
  
};

// Create a slice
const StatisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    setPoultryStatistics: (state , action : PayloadAction<PoultryDashboardData | null> ) => {
      state.poultryStatistics =  action.payload;
    }
  },
});

// Export actions
export const { setPoultryStatistics } = StatisticsSlice.actions;

// Export the reducer to use in the store
export default StatisticsSlice.reducer;