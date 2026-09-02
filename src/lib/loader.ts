import { setActiveFarm, setPermissions, setPermissionsLoading, setSubscription, setToken, setUser, logout } from '@/store/AuthenticationSlice';
import store from '../store/index';
import { getFarm, getFarmStatistics, getFlock, getPoultryMedicationData, getPoultryStatistics, GetToken, getUser, getPoultryVaccineData, getFeedinVentories, getMedicationInventories, getVaccineInventories, getGroupedPermisssions, getRolesWithPermissions, getFarmUsers, getFarmSalesProfitLoss, getMyPermissions, getUserPreferences, getFarmSettings, getCountries, getFeedAgeRanges, getFarmDashboard, StoreToken, getFarmSubscription, getSubscriptionPlans, getSubscriptionTransactions } from './request';
import type { DetailedFlockRecord, Farm, FarmSettings, FeedInventoryType, FeedType, MedicationData, MedicationInventory, PermissionGroup, Role, UserSettings, VaccineInventory, FarmUserRoleSummary, FarmDashboard, FarmAlerts, DashboardDatePreset, FarmSubscriptionSummary, SubscriptionPlan, SubscriptionTransaction } from './types';
import type { VaccineData } from './types';
import type { LoadFarmDataType, LoadPoultryOverviewDataType, LoadSalesProfitLossDataType } from './interfaces';
import { setPoultryStatistics } from '@/store/StatisticsSlice';
import { canAny } from './permissions';
import { matchRoutePermission } from './routePermissions';
import { redirect } from 'react-router-dom';

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

export const bootstrapImpersonationSession = async (token: string) => {
    StoreToken(token);
    store.dispatch(setToken(token));

    const response = await getUser(token);
    if (!response.success || !response.data) {
        localStorage.removeItem('authToken');
        store.dispatch(logout());
        return {
            success: false as const,
            error: response.error ?? ['Invalid or expired impersonation session'],
        };
    }

    store.dispatch(setUser(response.data));
    return { success: true as const, user: response.data };
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

export const LoadFarmDashboard = async (options?: {
    preset?: DashboardDatePreset;
    start_date?: string;
    end_date?: string;
}): Promise<{
    currentFarm: Farm | null;
    dashboard: FarmDashboard | null;
    alerts: FarmAlerts | null;
    permissions: string[];
    error?: string | null;
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    const farmId = currentFarm?.id ?? 0;
    const permissions = state.authentication.permissions ?? [];

    if (!farmId) {
        return { currentFarm: null, dashboard: null, alerts: null, permissions, error: 'No farm selected' };
    }

    const response = await getFarmDashboard(state.authentication.token, farmId, options);
    if (!response.success) {
        const message = response.error?.join(', ') || 'Failed to load dashboard';
        console.error('LoadFarmDashboard failed:', message);
        return {
            currentFarm,
            dashboard: null,
            alerts: null,
            permissions,
            error: message,
        };
    }

    const dashboard = response.data ?? null;

    return {
        currentFarm,
        dashboard,
        alerts: dashboard?.alerts ?? null,
        permissions,
        error: null,
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

export const LoadSalesProfitLossData = async (
    startDate?: string,
    endDate?: string
): Promise<LoadSalesProfitLossDataType> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    const farmId = currentFarm?.id ?? 0;

    try {
        const response = await getFarmSalesProfitLoss(
            state.authentication.token,
            farmId,
            startDate,
            endDate
        );
        return {
            salesProfitLoss: response.success ? (response.data ?? null) : null,
            currentFarm,
        };
    } catch (err) {
        console.error('Error loading sales profit and loss data:', err);
        return { salesProfitLoss: null, currentFarm };
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
export const LoadFeedinVentories = async (): Promise<{ feedInventories: FeedInventoryType[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    try {
        const response = await getFeedinVentories(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Feed Inventory Response:', response);
        if (response.success) {
            const feedInventories = response.data == null
                ? null
                : (Array.isArray(response.data) ? response.data : [response.data]);
            return { feedInventories };
        } else {
            console.error('Error loading vaccine data: ', response.error);
            return { feedInventories: null };
        }
    } catch (err) {
        console.error('Error loading vaccine data:', err);
        return { feedInventories: null };
    }
};

export const LoadMedicationInventories = async (): Promise<{ medicationInventories: MedicationInventory[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    
    try {
        const response = await getMedicationInventories (state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Medication Inventory Response:', response);
        if (response.success) {
            const medicationInventories = response.data == null

                ? null
                : (Array.isArray(response.data) ? response.data : [response.data]);
            return { medicationInventories };
        }
            else {
            console.error('Error loading medication inventory data: ', response.error);
            return { medicationInventories: null };
        }
    } catch (err) {
        console.error('Error loading medication inventory data:', err);
        return { medicationInventories: null };
    }
};

export const LoadVaccineInventories = async (): Promise<{  vaccineInventories: VaccineInventory[] | null} > => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    try {
        const response = await getVaccineInventories(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Vaccine Inventory Response:', response);
        if (response.success) {
            console.log('Raw Vaccine Inventory Data:', response.data);
            const vaccineInventories = response.data == null
            
                ? null
                : (Array.isArray(response.data) ? response.data : [response.data]).map((v: any) => {
                    // Ensure quantity is a number (API may return it as a string)
                    const rawQty = v?.quantity;
                    const qty = typeof rawQty === 'string'
                        ? (isNaN(parseFloat(rawQty)) ? 0 : parseFloat(rawQty))
                        : rawQty;
                    return {
                        ...v,
                        quantity: qty,
                    } as VaccineInventory;
                });
                console.log("vaccineInventories data : ", vaccineInventories);
            return { vaccineInventories };
        } else {
            console.error('Error loading vaccine inventory data: ', response.error);
            return { vaccineInventories: null };
        }
    } catch (err) {
        console.error('Error loading vaccine inventory data:', err);
        return { vaccineInventories: null };
    }
};

export const LoadPermissionGroups = async (): Promise<{
  PermissionGroups: PermissionGroup[] | null
  totalPermissions: number
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    try {
        const response = await getGroupedPermisssions(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Permission Groups Response:', response);
        if (response.success && response.data) {
            return {
              PermissionGroups: response.data.groups ?? null,
              totalPermissions: response.data.total_permissions ?? 0,
            };
        } else {
            console.error('Error loading permission groups data: ', response.error);
            return { PermissionGroups: null, totalPermissions: 0 };
        }
    } catch (err) {
        console.error('Error loading permission groups data:', err);
        return { PermissionGroups: null, totalPermissions: 0 };
    }
};

export const LoadRolesWithPermissions = async (): Promise<{ roles: Role[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    
    try {   
        const response = await getRolesWithPermissions(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Roles with Permissions Response:', response);

        if (response.success) {
            return { roles: response.data ?? null };
        }
        else {
            console.error('Error loading roles with permissions data: ', response.error);
            return { roles: null };
        }
    }
    catch (err) {
        console.error('Error loading roles with permissions data:', err);
        return { roles: null };
    }
};

export const LoadFarmUsers = async (): Promise<{ users: FarmUserRoleSummary[] | null }> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();
    
    try {
        const response = await getFarmUsers(state.authentication.token, currentFarm?.id ? currentFarm.id : 0);
        console.log('Farm Users Response:', response);

        if (response.success) {
            return { users: response.data ?? null };
        } else {
            console.error('Error loading farm users: ', response.error);
            return { users: null };
        }
    } catch (err) {
        console.error('Error loading farm users:', err);
        return { users: null };
    }
};

export const LoadFarmPermissions = async (force = false): Promise<{
    currentFarm: Farm | null
    permissions: string[]
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    if (!currentFarm?.id) {
        store.dispatch(setPermissions([]));
        return { currentFarm: null, permissions: [] };
    }

    const alreadyLoaded =
        !force &&
        state.authentication.permissionsLoaded &&
        state.authentication.permissionsFarmId === currentFarm.id;

    if (alreadyLoaded) {
        return { currentFarm, permissions: state.authentication.permissions };
    }

    store.dispatch(setPermissionsLoading(true));
    const response = await getMyPermissions(state.authentication.token, currentFarm.id);
    const permissions = response.success ? (response.data ?? []) : [];
    store.dispatch(setPermissions(permissions));

    return { currentFarm, permissions };
};

export const LoadFarmSubscription = async (force = false): Promise<{
    currentFarm: Farm | null
    subscription: FarmSubscriptionSummary | null
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const { currentFarm } = await LoadActiveFarm();

    if (!currentFarm?.id) {
        store.dispatch(setSubscription(null));
        return { currentFarm: null, subscription: null };
    }

    const alreadyLoaded =
        !force &&
        state.authentication.subscription !== null &&
        state.authentication.subscriptionFarmId === currentFarm.id;

    if (alreadyLoaded) {
        return { currentFarm, subscription: state.authentication.subscription };
    }

    const response = await getFarmSubscription(state.authentication.token, currentFarm.id);
    const subscription = response.success ? (response.data ?? null) : null;
    store.dispatch(setSubscription(subscription));

    return { currentFarm, subscription };
};

export const LoadBillingSettings = async (): Promise<{
    currentFarm: Farm | null
    subscription: FarmSubscriptionSummary | null
    plans: SubscriptionPlan[]
    transactions: SubscriptionTransaction[]
    permissions: string[]
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const context = await LoadSettingsContext();
    const { subscription } = await LoadFarmSubscription(true);

    if (!context.currentFarm?.id) {
        return {
            currentFarm: null,
            subscription: null,
            plans: [],
            transactions: [],
            permissions: context.permissions,
        };
    }

    const [plansResponse, transactionsResponse] = await Promise.all([
        getSubscriptionPlans(state.authentication.token),
        getSubscriptionTransactions(state.authentication.token, context.currentFarm.id),
    ]);

    return {
        currentFarm: context.currentFarm,
        subscription,
        plans: plansResponse.success ? (plansResponse.data ?? []) : [],
        transactions: transactionsResponse.success ? (transactionsResponse.data ?? []) : [],
        permissions: context.permissions,
    };
};

export async function requireRoutePermission(pathname: string): Promise<{ permissions: string[] }> {
    const { permissions } = await LoadFarmPermissions();
    const required = matchRoutePermission(pathname);
    if (required && required.length > 0 && !canAny(permissions, required)) {
        throw redirect(`/dashboard/forbidden?from=${encodeURIComponent(pathname)}`);
    }
    return { permissions };
}

export const LoadSettingsContext = async (): Promise<{
    currentFarm: Farm | null
    currentUser: AppState["authentication"]["user"]
    permissions: string[]
}> => {
    await Authenticated();
    const { currentFarm, permissions } = await LoadFarmPermissions();

    return {
        currentFarm,
        currentUser: store.getState().authentication.user,
        permissions,
    };
};

export const LoadUserPreferences = async (): Promise<{
    currentFarm: Farm | null
    currentUser: AppState["authentication"]["user"]
    userSettings: UserSettings | null
    permissions: string[]
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const context = await LoadSettingsContext();
    const response = await getUserPreferences(state.authentication.token);

    return {
        ...context,
        userSettings: response.success ? (response.data ?? null) : null,
    };
};

export const LoadFarmSettings = async (): Promise<{
    currentFarm: Farm | null
    farmSettings: FarmSettings | null
    countries: { id: number; name: string; code?: string | null }[]
    permissions: string[]
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const context = await LoadSettingsContext();

    if (!context.currentFarm?.id) {
        return {
            currentFarm: null,
            farmSettings: null,
            countries: [],
            permissions: context.permissions,
        };
    }

    const [settingsResponse, countriesResponse] = await Promise.all([
        getFarmSettings(state.authentication.token, context.currentFarm.id),
        getCountries(state.authentication.token),
    ]);

    return {
        currentFarm: context.currentFarm,
        farmSettings: settingsResponse.success ? (settingsResponse.data ?? null) : null,
        countries: countriesResponse.success ? (countriesResponse.data ?? []) : [],
        permissions: context.permissions,
    };
};

export const LoadFeedAgeRanges = async (): Promise<{
    currentFarm: Farm | null
    feedTypes: FeedType[]
    permissions: string[]
}> => {
    await Authenticated();
    const state: AppState = store.getState();
    const context = await LoadSettingsContext();

    if (!context.currentFarm?.id) {
        return {
            currentFarm: null,
            feedTypes: [],
            permissions: context.permissions,
        };
    }

    const response = await getFeedAgeRanges(state.authentication.token, context.currentFarm.id);

    return {
        currentFarm: context.currentFarm,
        feedTypes: response.success ? (response.data ?? []) : [],
        permissions: context.permissions,
    };
};