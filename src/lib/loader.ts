import { setActiveFarm, setToken, setUser } from '@/store/AuthenticationSlice';
import store from '../store/index';
import { getFarm, getFarmStatistics, getFlock, getPoultryMedicationData, getPoultryStatistics, GetToken, getUser, getPoultryVaccineData } from './request';
import type { DetailedFlockRecord, Farm, MedicationData } from './types';
import type { VaccineData } from './types';
import type { LoadFarmDataType, LoadPoultryOverviewDataType } from './interfaces';
import { setPoultryStatistics } from '@/store/StatisticsSlice';

type AppState = ReturnType<typeof store.getState>;

export const Authenticated = async (): Promise<boolean> => {
    const state: AppState = store.getState();
    if (state.authentication.authenticated) {
        return true;
    }

    const token = GetToken();
    if (!token) {
        return false;
    }

    try {
        const response = await getUser(token);
        if (response.success) {
            store.dispatch(setToken(token));
            store.dispatch(setUser(response.data ?? null));
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error during authentication check:', err);
        return false;
    }
};

export const LoadActiveFarm = async (): Promise<{ currentFarm: Farm | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const persistedFarm = getFarm();

    if (state.authentication.activeFarm != null) {
        return { currentFarm: state.authentication.activeFarm };
    }

    if (persistedFarm != null) {
        store.dispatch(setActiveFarm(persistedFarm));
        return { currentFarm: persistedFarm };
    }

    return { currentFarm: null };
};

export const LoadFarmData = async (): Promise<LoadFarmDataType> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    const farmStats = await getFarmStatistics(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);

    console.log('Farm Statistics : ', farmStats);
    console.log('Current Farm : ', currentFarm);

    return {
        farmStats,
        currentFarm,
    };
};

export const LoadPoultryOverviewData = async (): Promise<LoadPoultryOverviewDataType> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    const poultryStatistics = await getPoultryStatistics(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);

    store.dispatch(setPoultryStatistics(poultryStatistics.data ?? null));
    console.log('Poultry Statistics : ', poultryStatistics);
    console.log('Current Farm : ', currentFarm);

    return {
        PoultryStatistics: poultryStatistics,
        currentFarm,
    };
};

export const LoadFlockData = async (flockId: number): Promise<{ Flock: DetailedFlockRecord | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    try {
        const response = await getFlock(state.authentication.token, currentFarm?.id ? currentFarm.id : 0, flockId);
        if (response.success) {
            return { Flock: response.data ?? null };
        }
        console.error('Error loading flock data: ', response.error);
        return { Flock: null };
    } catch (err) {
        console.error('Error loading flock data:', err);
        return { Flock: null };
    }
};

export const LoadMedicationData = async (): Promise<{ medications: MedicationData[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    try {
        const response = await getPoultryMedicationData(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        if (response.success) {
            const medications = response.data == null
                ? null
                : (Array.isArray(response.data) ? response.data : [response.data]);
            return { medications };
        } else {
            console.error('Error loading medication data: ', response.error);
            return { medications: null };
        }
    } catch (err) {
        console.error('Error loading medication data:', err);
        return { medications: null };
    }
};

export const LoadVaccineData = async (): Promise<{ vaccines: VaccineData[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    try {
        const response = await getPoultryVaccineData(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        if (response.success) {
            const vaccines = response.data == null
                ? null
                : (Array.isArray(response.data) ? response.data : [response.data]);
            return { vaccines };
        } else {
            console.error('Error loading vaccine data: ', response.error);
            return { vaccines: null };
        }
    } catch (err) {
        console.error('Error loading vaccine data:', err);
        return { vaccines: null };
    }
};