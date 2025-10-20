import { setActiveFarm, setToken, setUser } from '@/store/AuthenticationSlice';
import store from '../store/index';
import { getFarm, getFarmStatistics, getFlock, getPoultryStatistics, GetToken, getUser } from './request';
import type { DetailedFlockRecord, Farm } from './types';
import type { getFarmStatsResponseData, LoadFarmDataType, LoadPoultryOverviewDataType } from './interfaces';
import { setPoultryStatistics } from '@/store/StatisticsSlice';


export const Authenticated = async () : Promise<boolean> => {
    const state = store.getState();
    if(state.authentication.authenticated){
        return true;
    }
    const token = GetToken();
    if(token) {

        const response = await getUser(token);
        console.log(response);
        if(response.success){
            store.dispatch(setToken(token));
            store.dispatch(setUser(response.data ?? null));
            return true;
        }
        
    }
    return false;
   
}

export const LoadFarmData = async () : Promise<LoadFarmDataType> => {
    await Authenticated();
    const state = store.getState();
    const {currentFarm} = await LoadActiveFarm();
    const farmStats = await getFarmStatistics(state.authentication.token , currentFarm?.id ? currentFarm.id : 0);
    
    console.log("Farm Statistics : ", farmStats);
    console.log("Current Farm : ", currentFarm);
    return {
        farmStats,
        currentFarm 
    }


}
export const LoadPoultryOverviewData = async () : Promise<LoadPoultryOverviewDataType> => {
    await Authenticated();
    const state = store.getState();
    const {currentFarm} = await LoadActiveFarm();
    const PoultryStatistics = await getPoultryStatistics(state.authentication.token , currentFarm?.id ? currentFarm.id : 0);

    store.dispatch(setPoultryStatistics(PoultryStatistics.data ?? null));
    console.log("Poultry Statistics : ", PoultryStatistics);
    console.log("Current Farm : ", currentFarm);
    return {
        PoultryStatistics,
        currentFarm 
    } 
}
export const LoadActiveFarm =  async () : Promise<{currentFarm : Farm | null}> => {
    await Authenticated();
    const state = store.getState();
    const activeFarm = getFarm();
    if(state.authentication.activeFarm != null){

       return { currentFarm: state.authentication.activeFarm}
    }
    if(activeFarm != null){
        store.dispatch(setActiveFarm(activeFarm));
        return { currentFarm: activeFarm}

    }
     return { currentFarm: null };
}

export const LoadFlockData = async (flockId: number) : Promise< {Flock : DetailedFlockRecord | null}> => {
    await Authenticated();
    const state = store.getState();
    const {currentFarm} = await LoadActiveFarm();
    const respose = await getFlock(state.authentication.token, currentFarm?.id ? currentFarm.id : 0, flockId);
    if(respose.success){
        return {Flock: respose.data ?? null};
    }
    else{
        console.error("Error loading flock data: ", respose.error);
        return {Flock: null};
    }   

   
}