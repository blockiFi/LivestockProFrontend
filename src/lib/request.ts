import axios from "./axios"
import type {    LoginData,  PaginatedRequestType,  RequestResponse } from "./interfaces"
import type { AuthResponse, DetailedFlockRecord, DetailedSchedule, Farm, FarmSettings, FarmStatsDataType, FlockRecord, PoultryDashboardData, UserSettings, WeatherDataType, PoultryType, PoultryHouse, FlockStage, WeightReport, EggReport, MortalityReport, PoultryFeedUsageRecord, FeedInventoryType, FeedType, Medication, VaccineProduct, MedicationData, VaccineData, MedicationProduct, AdministrationMethod, vaccine, PoultryVaccineInventory, MedicationInventory, VaccineInventory, PermissionGroup, Role, FeedingSchedule, PoultryFeedProduct, FeedComponent, FeedComposition, FlockExpenditure, FlockExpenditureSummary, FlockSale, FlockProfitLoss, FlockPerformanceMetrics, FlockMetricsAiResponse, FlockComparativeReport, FlockComparativeAiInsights, FlockComparativeMetrics, FlockComparativeRow, FlockComparativeAggregate, FarmSalesProfitLoss, SalesRecord, FarmUserRoleSummary, User, FarmDashboard, FarmAlerts, DashboardKpis, DashboardDatePreset, SubscriptionPlan, FarmSubscriptionSummary, SubscriptionTransaction, PaystackCheckout } from "./types"
import  { isAxiosError } from "axios"

const flattenApiErrors = (error: unknown): string => {
  if (!error) return ""
  if (typeof error === "string") return error
  if (Array.isArray(error)) return error.map(String).join(", ")
  if (typeof error === "object") {
    return Object.values(error as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(String)
      .filter(Boolean)
      .join(", ")
  }
  return String(error)
}

 export const UserLogin = async( data  : LoginData) : Promise<AuthResponse> => {
    try {
        const response = await  axios.post("/api/login" , data)
        if(response.status === 200){
            console.log("token in Function : ",  response.data.data.token)
           return {
            success : true,
            data : response.data.data,
            token : response.data.data.token

           }
        }else{
           return { success : false,
            error: [`Authenication Failed!!! ${response.status}`]}
        }
       } catch (error: unknown) {
        console.log(error);
        if (isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.errors || [error.response?.data?.message]
                 || ["Login failed"],
              };
        }
        else{
            return {
                success: false,
                error: ["An unexpected error occurred"],
              };
        
        }
    
    }

    
 }

 export const getUser = async (token : string) : Promise<AuthResponse > => {
    try {
        const response = await  axios.get("/api/user" , { headers: {"Authorization" : `Bearer ${token}`} })
        if(response.status === 200){
           return {
            success: true,
            data : response.data.data,
            
            }
           
        }else{
           return { success : false,
            error: [`Authenication Failed!!! ${response.status}`]}
        }
       } catch (error: unknown) {
        console.log(error);
        if (isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.errors || ["Login failed"],
              };
        }
        else{
            return {
                success: false,
                error: ["An unexpected error occurred"],
              };
        
        }
    
    }
 }

 export const getUserFarms = async (token : string) : Promise<RequestResponse<Farm[]>>  => {
    try {
        const response = await  axios.get("/api/farms" , { headers: {"Authorization" : `Bearer ${token}`} })
        if(response.status === 200){
           return {
            success: true,
            data :  response.data.data
           }
        }else{
           return { 
            success : false,
            error: [`Authentication Failed!!! ${response.status}`]
        }
        }
       } catch (error: unknown) {
        console.log(error);
        if (isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.errors || ["Login failed"],
              };
        }
        else{
            return {
                success: false,
                error: ["An unexpected error occurred"],
              };
        
        }
    
    } 
 }

export type CountryOption = { id: number; name: string; code?: string | null };

export const getCountries = async (token: string): Promise<RequestResponse<CountryOption[]>> => {
  try {
    const response = await axios.get("/api/countries", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error getting countries (${response.status})`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || ["Request failed while loading countries"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export type CreateFarmPayload = {
  name: string;
  address: string;
  city: string;
  state: string;
  country_id: number;
  size_hectares?: number | null;
  established_date?: string | null; // yyyy-mm-dd
  phone?: string | null;
  email?: string | null;
  postal_code?: string | null;
  website?: string | null;
  registration_number?: string | null;
};

export const createFarm = async (
  token: string,
  payload: CreateFarmPayload,
): Promise<RequestResponse<Farm>> => {
  try {
    const response = await axios.post("/api/farms", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Farm creation failed (${response.status})`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || ["Farm creation failed"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};
 export  const  StoreToken = (token : string) => {
    localStorage.setItem('authToken', token);
  }
  
  export const GetToken = () : string | null => {
    return localStorage.getItem('authToken');
  }

  export const StoreFarm = (farm : Farm) => {
  localStorage.setItem('activeFarm', JSON.stringify(farm));
  }

  export const clearStoredFarm = () => {
    localStorage.removeItem('activeFarm');
  }

  export const getFarm = () : Farm | null => {
  const farmString = localStorage.getItem('activeFarm');
  if (farmString) {
    try {
      return JSON.parse(farmString) as Farm;
    } catch (e) {
      console.error("Failed to parse activeFarm from localStorage", e);
      return null;
    }
  }
  return null;
  }
  export const getWeather = async (): Promise<WeatherDataType | null> => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
    console.log("API KEY :" , API_KEY);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`)
          .then(response => response.json())
          .then(data => {
            if (data.main && data.weather && data.weather[0]) {
              resolve({
                temp: data.main.temp ?? "",
                feels_like: data.main.feels_like ?? "",
                temp_min: data.main.temp_min ?? "",
                temp_max: data.main.temp_max ?? "",
                pressure: data.main.pressure ?? 0,
                humidity: data.main.humidity ?? 0,
                id: data.weather[0].id ?? 300,
                description: data.weather[0].main ?? ""
              });
            } else {
              resolve(null);
            }
          })
          .catch(reject);
      }, reject);
    });
  };
 
  export const getFarmStatistics = async (token : string,farmId  : number) : Promise<RequestResponse<FarmStatsDataType>> => {
    // 

    try {
        console.log("Token from get stats : ",token);
        const response = await  axios.get(`api/farms/${farmId}/statistics` , { headers: {"Authorization" : `Bearer ${token}`} })
        if(response.status === 200){
           return {
            success: true,
            data :  response.data.data
           }
        }else{
           return { 
            success : false,
            error: [`Error getting Farm Statistics Data!!! ${response.status}`]
        }
        }
       } catch (error: unknown) {
        console.log(error);
        if (isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.errors || ["Exois Request failed"],
              };
        }
        else{
            return {
                success: false,
                error: ["An unexpected error occurred"],
              };
        
        }
    
    } 
  }

  export const getPoultryStatistics = async (token : string,farmId  : number , start_date? : string , end_date? : string ): Promise<RequestResponse<PoultryDashboardData> > => {
    try {
      let url: string = `/api/farms/${farmId}/poultry-statistics`;

      if (start_date && end_date) {
        url += `?start_date=${start_date}&end_date=${end_date}`;

      }
        const response = await  axios.get(url , { headers: {"Authorization" : `Bearer ${token}`} })
        if(response.status === 200){
           return {
            success: true,
            data :  response.data.data
           }
        }else{
           return { 
            success : false,
            error: [`Error getting Poultry Statistics Data!!! ${response.status}`]
        }
        }
       } catch (error: unknown) {
        console.log(error);
        if (isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.errors || ["Exois Request failed"],
              };
        }
        else{
            return {
                success: false,
                error: ["An unexpected error occurred"],
              };
        
        }
    
    } 
  }

  /* top-level sanitizer helpers so they can be reused across this module */
  
  // Helper to sanitize nested arrays
  const sanitizeArray = (arr: any[], sanitizer: (item: any) => any) => Array.isArray(arr) ? arr.map(sanitizer) : [];
  
  // Helper to sanitize string|number fields
  const toNumber = (val: any) => (val !== undefined && val !== null && val !== "" ? Number(val) : val);
  
  // Helper for MedicationInventory
  const sanitizeMedicationInventory = (inv: any) => inv ? {
    ...inv,
    id: toNumber(inv.id),
    medication_product_id: toNumber(inv.medication_product_id),
    farm_id: toNumber(inv.farm_id),
    quantity: toNumber(inv.quantity),
    unit_cost: toNumber(inv.unit_cost),
  } : undefined;
  
  // Helper for Medication
  const sanitizeMedication = (med: any) => med ? {
    ...med,
    id: toNumber(med.id),
    farm_id: med.farm_id !== undefined && med.farm_id !== null ? toNumber(med.farm_id) : null,
  } : undefined;
  
  // Helper for AdministrationMethod
  const sanitizeAdministrationMethod = (adm: any) => adm ? {
    ...adm,
    id: toNumber(adm.id),
  } : undefined;
  
  // Helper for FeedInventoryType
  const sanitizeFeedInventory = (inv: any) => inv ? {
    ...inv,
    id: toNumber(inv.id),
    farm_id: toNumber(inv.farm_id),
    poultry_feed_type_id: toNumber(inv.poultry_feed_type_id),
    quantity: toNumber(inv.quantity),
    available_quantity: toNumber(inv.available_quantity),
    unit_cost: toNumber(inv.unit_cost),
    feed_usages_count: toNumber(inv.feed_usages_count),
    can_delete: Boolean(inv.can_delete),
    damaged_quantity: toNumber(inv.damaged_quantity),
    allocated_flock_id: inv.allocated_flock_id !== undefined && inv.allocated_flock_id !== null
      ? toNumber(inv.allocated_flock_id)
      : inv.allocated_flock_id,
    created_by: inv.created_by !== undefined && inv.created_by !== null ? toNumber(inv.created_by) : inv.created_by,
    allocated_flock: inv.allocated_flock ? {
      ...inv.allocated_flock,
      id: toNumber(inv.allocated_flock.id),
    } : undefined,
    feed_type: inv.feed_type ? {
      ...inv.feed_type,
      id: toNumber(inv.feed_type.id),
      poultry_type_id: toNumber(inv.feed_type.poultry_type_id),
      min_stock_level : toNumber(inv.feed_type.min_stock_level),
      start_age: inv.feed_type.start_age !== null && inv.feed_type.start_age !== undefined ? toNumber(inv.feed_type.start_age) : null,
      end_age: inv.feed_type.end_age !== null && inv.feed_type.end_age !== undefined ? toNumber(inv.feed_type.end_age) : null,
    } : undefined,
  } : undefined;
  
  // Helper for PoultryVaccinationRecord
  const sanitizeVaccinationRecord = (rec: any) => rec ? {
    ...rec,
    id: toNumber(rec.id),
    farm_id: toNumber(rec.farm_id),
    flock_id: toNumber(rec.flock_id),
    poultry_vaccine_id: toNumber(rec.poultry_vaccine_id),
    poultry_vaccine_inventory_id: toNumber(rec.poultry_vaccine_inventory_id),
    dosage: toNumber(rec.dosage),
    quantity: toNumber(rec.quantity),
    cost: toNumber(rec.cost),
    administration_method_id: toNumber(rec.administration_method_id),
    notes: rec.notes, // notes is number in type, but may be string, so leave as-is
    administration_method: sanitizeAdministrationMethod(rec.administration_method),
  } : undefined;
  
  // Helper for PoultryMedicationRecord
  const sanitizeMedicationRecord = (rec: any) => rec ? {
    ...rec,
    id: toNumber(rec.id),
    farm_id: toNumber(rec.farm_id),
    flock_id: toNumber(rec.flock_id),
    poultry_medication_id: toNumber(rec.poultry_medication_id),
    poultry_medication_inventory_id: toNumber(rec.poultry_medication_inventory_id),
    dosage: toNumber(rec.dosage),
    quantity: toNumber(rec.quantity),
    cost: toNumber(rec.cost),
    administration_method_id: toNumber(rec.administration_method_id),
    medication: sanitizeMedication(rec.medication),
    medication_inventory: sanitizeMedicationInventory(rec.medication_inventory),
    administration_method: sanitizeAdministrationMethod(rec.administration_method),
  } : undefined;
  
  // Helper for PoultryFeedUsageRecord
  const sanitizeFeedUsage = (r: any) => r ? {
    ...r,
    id: toNumber(r.id),
    farm_id: toNumber(r.farm_id),
    poultry_feed_inventory_id: toNumber(r.poultry_feed_inventory_id),
    poultry_feed_type_id: toNumber(r.poultry_feed_type_id),
    flock_id: toNumber(r.flock_id),
    quantity: toNumber(r.quantity),
    unit_cost: toNumber(r.unit_cost),
    created_by: toNumber(r.created_by),
    feed_inventory: sanitizeFeedInventory(r.feed_inventory),
    feed_type: r.feed_type ? {
      ...r.feed_type,
      id: toNumber(r.feed_type.id),
      poultry_type_id: toNumber(r.feed_type.poultry_type_id),
      start_age: r.feed_type.start_age !== null && r.feed_type.start_age !== undefined ? toNumber(r.feed_type.start_age) : null,
      end_age: r.feed_type.end_age !== null && r.feed_type.end_age !== undefined ? toNumber(r.feed_type.end_age) : null,
    } : undefined,
    flock: r.flock ? {
      id: toNumber(r.flock.id),
      name: r.flock.name ?? '',
      batch_number: r.flock.batch_number ?? '',
    } : undefined,
    recorded_by_name: r.creator?.name ?? r.recorded_by_name ?? null,
  } : undefined;
    const sanitizeVaccineInventory = (inv: any) => inv ? {
    ...inv,
    id: toNumber(inv.id),
    poultry_vaccine_product_id: toNumber(inv.poultry_vaccine_product_id),
    farm_id: toNumber(inv.farm_id),
    quantity: toNumber(inv.quantity),
    available_quantity: toNumber(inv.available_quantity),
    unit_cost: toNumber(inv.unit_cost),
    created_by: inv.created_by !== undefined && inv.created_by !== null ? toNumber(inv.created_by) : inv.created_by,
    product: inv.product ? {
      ...inv.product,
      id: toNumber(inv.product.id),
      poultry_vaccine_id: toNumber(inv.product.poultry_vaccine_id),
      min_stock_level: inv.product.min_stock_level !== undefined && inv.product.min_stock_level !== null ? toNumber(inv.product.min_stock_level) : inv.product.min_stock_level,
    } : undefined,
  } : undefined;

  const sanitizeFlockExpenditure = (e: any) => e ? {
    ...e,
    id: toNumber(e.id),
    farm_id: toNumber(e.farm_id),
    flock_id: toNumber(e.flock_id),
    amount: toNumber(e.amount),
    source_id: e.source_id !== null && e.source_id !== undefined ? toNumber(e.source_id) : null,
  } : undefined;

  const sanitizeFlockSale = (s: any) => s ? {
    ...s,
    id: toNumber(s.id),
    farm_id: toNumber(s.farm_id),
    flock_id: toNumber(s.flock_id),
    quantity: toNumber(s.quantity),
    unit_price: toNumber(s.unit_price),
    total_amount: toNumber(s.total_amount),
    daily_record_id: s.daily_record_id !== null && s.daily_record_id !== undefined ? toNumber(s.daily_record_id) : null,
    culls_applied: toNumber(s.culls_applied),
  } : undefined;

  // Prefer canonical DB columns; legacy columns default to 0 so `??` must not read them first.
  const pickDailyRecordField = (canonical: any, legacy: any, fallback = 0) => {
    if (canonical !== null && canonical !== undefined && canonical !== '') {
      return toNumber(canonical);
    }
    if (legacy !== null && legacy !== undefined && legacy !== '') {
      return toNumber(legacy);
    }
    return fallback;
  };

  const sanitizeWeightReport = (r: any) => {
    if (!r) return r;
    const recorder = typeof r.recorded_by === 'object' && r.recorded_by !== null
      ? r.recorded_by
      : null;

    return {
      ...r,
      id: toNumber(r.id),
      farm_id: toNumber(r.farm_id),
      flock_id: toNumber(r.flock_id),
      average_weight: toNumber(r.average_weight),
      min_weight: toNumber(r.min_weight),
      max_weight: toNumber(r.max_weight),
      number_of_birds: toNumber(r.number_of_birds),
      sample_size: toNumber(r.sample_size),
      recorded_by: toNumber(recorder?.id ?? r.recorded_by),
      recorded_by_name: recorder?.name ?? r.recorded_by_name ?? null,
    };
  };

  const sanitizeEggReport = (r: any) => {
    if (!r) return r;
    const recorder = typeof r.recorded_by === 'object' && r.recorded_by !== null
      ? r.recorded_by
      : (r.recorded_by_user ?? r.recordedBy ?? null);

    return {
      ...r,
      id: toNumber(r.id),
      farm_id: toNumber(r.farm_id),
      flock_id: toNumber(r.flock_id),
      eggs_collected: toNumber(r.eggs_collected),
      eggs_broken: toNumber(r.eggs_broken),
      average_egg_weight: toNumber(r.average_egg_weight),
      production_percentage: toNumber(r.production_percentage),
      bird_count: toNumber(r.bird_count),
      recorded_by: toNumber(recorder?.id ?? r.recorded_by),
      recorded_by_name: recorder?.name ?? r.recorded_by_name ?? null,
    };
  };

  const sanitizeDailyRecord = (r: any) => {
    if (!r) return r;
    const additional = r.additional_data && typeof r.additional_data === 'object' ? r.additional_data : {};

    const mortality = pickDailyRecordField(r.mortality_count, r.mortality);
    const culls = pickDailyRecordField(r.culling_count, r.culls);
    const feedKg = pickDailyRecordField(r.feed_consumption_kg, r.feed_consumed_kg);
    const waterL = pickDailyRecordField(r.water_consumption_liters, r.water_consumed_liters);

    let avgWeightGrams = r.avg_weight_grams;
    if ((avgWeightGrams === null || avgWeightGrams === undefined || Number(avgWeightGrams) === 0) && r.average_weight_kg) {
      avgWeightGrams = toNumber(r.average_weight_kg) * 1000;
    }

    const humidity = pickDailyRecordField(r.humidity_percentage, r.humidity ?? additional.humidity);
    const minTemp = r.min_temperature ?? additional.min_temperature ?? r.temperature_celsius ?? null;
    const maxTemp = r.max_temperature ?? additional.max_temperature ?? r.temperature_celsius ?? null;
    const lightHours = r.light_hours ?? additional.light_hours ?? 0;
    const eggsCollected = pickDailyRecordField(r.egg_production_count, r.eggs_collected);
    const eggsBroken = pickDailyRecordField(additional.eggs_broken, r.eggs_broken);
    const minWeightGrams = pickDailyRecordField(r.min_weight_grams, additional.min_weight_grams);
    const maxWeightGrams = pickDailyRecordField(r.max_weight_grams, additional.max_weight_grams);
    const sampleSize = pickDailyRecordField(r.sample_size, additional.sample_size);

    return {
      ...r,
      id: toNumber(r.id),
      farm_id: toNumber(r.farm_id),
      flock_id: toNumber(r.flock_id),
      mortality: toNumber(mortality),
      culls: toNumber(culls),
      feed_consumed_kg: toNumber(feedKg),
      water_consumed_liters: toNumber(waterL),
      avg_weight_grams: toNumber(avgWeightGrams),
      min_weight_grams: toNumber(minWeightGrams),
      max_weight_grams: toNumber(maxWeightGrams),
      sample_size: toNumber(sampleSize),
      min_temperature: minTemp !== null && minTemp !== undefined ? toNumber(minTemp) : null,
      max_temperature: maxTemp !== null && maxTemp !== undefined ? toNumber(maxTemp) : null,
      humidity: toNumber(humidity),
      light_hours: toNumber(lightHours),
      eggs_collected: toNumber(eggsCollected),
      eggs_broken: toNumber(eggsBroken),
      recorded_by: toNumber(r.recorded_by),
    };
  };

  function sanitizeFlockRecord(record: any) {
    // Sanitize nested objects
    const sanitized = {
      ...record,
      id: toNumber(record.id),
      farm_id: toNumber(record.farm_id),
      house_id: toNumber(record.house_id),
      poultry_weight_report_frequency_id: record.poultry_weight_report_frequency_id !== undefined && record.poultry_weight_report_frequency_id !== null ? toNumber(record.poultry_weight_report_frequency_id) : null,
      poultry_type_id: toNumber(record.poultry_type_id),
      flock_stage_id: toNumber(record.flock_stage_id),
      quantity: toNumber(record.quantity),
      arrival_age_days: toNumber(record.arrival_age_days),
      // Nested poultry_type
      poultry_type: record.poultry_type ? {
        ...record.poultry_type,
        id: toNumber(record.poultry_type.id),
        average_lifespan_days: record.poultry_type.average_lifespan_days !== null && record.poultry_type.average_lifespan_days !== undefined ? toNumber(record.poultry_type.average_lifespan_days) : null,
        average_weight_kg: record.poultry_type.average_weight_kg !== null && record.poultry_type.average_weight_kg !== undefined ? toNumber(record.poultry_type.average_weight_kg) : null,
        is_active: toNumber(record.poultry_type.is_active)
      } : undefined,
      // Nested flock_stage
      flock_stage: record.flock_stage ? {
        ...record.flock_stage,
        id: toNumber(record.flock_stage.id),
        poultry_type_id: toNumber(record.flock_stage.poultry_type_id),
        from_age: toNumber(record.flock_stage.from_age),
        to_age: toNumber(record.flock_stage.to_age)
      } : undefined,
      // Nested poultry_house
      poultry_house: record.poultry_house ? {
        ...record.poultry_house,
        id: toNumber(record.poultry_house.id),
        farm_id: toNumber(record.poultry_house.farm_id),
        poultry_type_id: toNumber(record.poultry_house.poultry_type_id),
        capacity: toNumber(record.poultry_house.capacity)
      } : undefined,
      // Nested arrays
      daily_records: sanitizeArray(record.daily_records ?? record.dailyRecords, sanitizeDailyRecord),
      mortality_reports: sanitizeArray(record.mortality_reports, (r: any) => ({
        ...r,
        id: toNumber(r.id),
        farm_id: toNumber(r.farm_id),
        flock_id: toNumber(r.flock_id),
        poultry_type_id: toNumber(r.poultry_type_id),
        mortality_count: toNumber(r.mortality_count),
        average_weight: toNumber(r.average_weight),
        mortality_percentage: toNumber(r.mortality_percentage),
        bird_count: toNumber(r.bird_count),
        recorded_by: toNumber(r.recorded_by)
      })),
      weight_reports: sanitizeArray(record.weight_reports, sanitizeWeightReport),
      egg_reports: sanitizeArray(record.egg_reports, sanitizeEggReport),
      batch_schedules: record.batch_schedules ? {
        ...record.batch_schedules,
        id: toNumber(record.batch_schedules.id),
        farm_id: toNumber(record.batch_schedules.farm_id),
        flock_id: toNumber(record.batch_schedules.flock_id),
        schedule_id: toNumber(record.batch_schedules.schedule_id),
        items: sanitizeArray(record.batch_schedules.items, (item: any) => ({
          ...item,
          id: toNumber(item.id),
          batch_schedule_id: toNumber(item.batch_schedule_id),
          schedule_item_id: toNumber(item.schedule_item_id),
          administered_by: item.administered_by !== null && item.administered_by !== undefined ? toNumber(item.administered_by) : null,
          poultry_vaccine_product_id: item.poultry_vaccine_product_id !== null && item.poultry_vaccine_product_id !== undefined ? toNumber(item.poultry_vaccine_product_id) : null,
          vaccine_product_batch_id: item.vaccine_product_batch_id !== null && item.vaccine_product_batch_id !== undefined ? toNumber(item.vaccine_product_batch_id) : null,
          poultry_medication_id: item.poultry_medication_id !== null && item.poultry_medication_id !== undefined ? toNumber(item.poultry_medication_id) : null,
          dosage: toNumber(item.dosage),
          quantity: toNumber(item.quantity),
          cost: toNumber(item.cost),
          administration_method_id: toNumber(item.administration_method_id),
          age_days: item.age_days !== undefined ? toNumber(item.age_days) : undefined,
          withdrawal_period_days: item.withdrawal_period_days !== undefined ? toNumber(item.withdrawal_period_days) : undefined,
          poultry_vaccine_id: item.poultry_vaccine_id !== undefined && item.poultry_vaccine_id !== null ? toNumber(item.poultry_vaccine_id) : null,
          poultry_medication_id2: item.poultry_medication_id2 !== undefined && item.poultry_medication_id2 !== null ? toNumber(item.poultry_medication_id2) : null,
          schedule_item: item.schedule_item ? {
            ...item.schedule_item,
            id: toNumber(item.schedule_item.id),
            schedule_id: toNumber(item.schedule_item.schedule_id),
            age_days: toNumber(item.schedule_item.age_days),
            poultry_vaccine_id: item.schedule_item.poultry_vaccine_id !== undefined && item.schedule_item.poultry_vaccine_id !== null ? toNumber(item.schedule_item.poultry_vaccine_id) : null,
            poultry_medication_id: item.schedule_item.poultry_medication_id !== undefined && item.schedule_item.poultry_medication_id !== null ? toNumber(item.schedule_item.poultry_medication_id) : null,
            dose: toNumber(item.schedule_item.dose),
            withdrawal_period_days: toNumber(item.schedule_item.withdrawal_period_days),
          } : undefined,
        }))
      } : undefined,
      batch_vaccination_schedules: sanitizeArray(record.batch_vaccination_schedules, (s: any) => ({
        ...s,
        id: toNumber(s.id),
        farm_id: toNumber(s.farm_id),
        flock_id: toNumber(s.flock_id),
        schedule_id: toNumber(s.schedule_id),
        items: sanitizeArray(s.items, (item: any) => ({
          ...item,
          id: toNumber(item.id),
          batch_schedule_id: toNumber(item.batch_schedule_id),
          schedule_item_id: toNumber(item.schedule_item_id),
          administered_by: item.administered_by !== null && item.administered_by !== undefined ? toNumber(item.administered_by) : null,
          poultry_vaccine_product_id: item.poultry_vaccine_product_id !== null && item.poultry_vaccine_product_id !== undefined ? toNumber(item.poultry_vaccine_product_id) : null,
          vaccine_product_batch_id: item.vaccine_product_batch_id !== null && item.vaccine_product_batch_id !== undefined ? toNumber(item.vaccine_product_batch_id) : null,
          poultry_medication_id: item.poultry_medication_id !== null && item.poultry_medication_id !== undefined ? toNumber(item.poultry_medication_id) : null,
          dosage: toNumber(item.dosage),
          quantity: toNumber(item.quantity),
          cost: toNumber(item.cost),
          administration_method_id: toNumber(item.administration_method_id),
          age_days: item.age_days !== undefined ? toNumber(item.age_days) : undefined,
          withdrawal_period_days: item.withdrawal_period_days !== undefined ? toNumber(item.withdrawal_period_days) : undefined,
          poultry_vaccine_id: item.poultry_vaccine_id !== undefined && item.poultry_vaccine_id !== null ? toNumber(item.poultry_vaccine_id) : null,
          poultry_medication_id2: item.poultry_medication_id2 !== undefined && item.poultry_medication_id2 !== null ? toNumber(item.poultry_medication_id2) : null,
          schedule_item: item.schedule_item ? {
            ...item.schedule_item,
            id: toNumber(item.schedule_item.id),
            schedule_id: toNumber(item.schedule_item.schedule_id),
            age_days: toNumber(item.schedule_item.age_days),
            poultry_vaccine_id: item.schedule_item.poultry_vaccine_id !== undefined && item.schedule_item.poultry_vaccine_id !== null ? toNumber(item.schedule_item.poultry_vaccine_id) : null,
            poultry_medication_id: item.schedule_item.poultry_medication_id !== undefined && item.schedule_item.poultry_medication_id !== null ? toNumber(item.schedule_item.poultry_medication_id) : null,
            dose: toNumber(item.schedule_item.dose),
            withdrawal_period_days: toNumber(item.schedule_item.withdrawal_period_days),
          } : undefined,
        }))
      })),
      batch_medication_schedules: sanitizeArray(record.batch_medication_schedules, (s: any) => ({
        ...s,
        id: toNumber(s.id),
        farm_id: toNumber(s.farm_id),
        flock_id: toNumber(s.flock_id),
        schedule_id: toNumber(s.schedule_id),
        items: sanitizeArray(s.items, (item: any) => ({
          ...item,
          id: toNumber(item.id),
          batch_schedule_id: toNumber(item.batch_schedule_id),
          schedule_item_id: toNumber(item.schedule_item_id),
          administered_by: item.administered_by !== null && item.administered_by !== undefined ? toNumber(item.administered_by) : null,
          poultry_vaccine_product_id: item.poultry_vaccine_product_id !== null && item.poultry_vaccine_product_id !== undefined ? toNumber(item.poultry_vaccine_product_id) : null,
          vaccine_product_batch_id: item.vaccine_product_batch_id !== null && item.vaccine_product_batch_id !== undefined ? toNumber(item.vaccine_product_batch_id) : null,
          poultry_medication_id: item.poultry_medication_id !== null && item.poultry_medication_id !== undefined ? toNumber(item.poultry_medication_id) : null,
          dosage: toNumber(item.dosage),
          quantity: toNumber(item.quantity),
          cost: toNumber(item.cost),
          administration_method_id: toNumber(item.administration_method_id),
          age_days: item.age_days !== undefined ? toNumber(item.age_days) : undefined,
          withdrawal_period_days: item.withdrawal_period_days !== undefined ? toNumber(item.withdrawal_period_days) : undefined,
          poultry_vaccine_id: item.poultry_vaccine_id !== undefined && item.poultry_vaccine_id !== null ? toNumber(item.poultry_vaccine_id) : null,
          poultry_medication_id2: item.poultry_medication_id2 !== undefined && item.poultry_medication_id2 !== null ? toNumber(item.poultry_medication_id2) : null,
          schedule_item: item.schedule_item ? {
            ...item.schedule_item,
            id: toNumber(item.schedule_item.id),
            schedule_id: toNumber(item.schedule_item.schedule_id),
            age_days: toNumber(item.schedule_item.age_days),
            poultry_vaccine_id: item.schedule_item.poultry_vaccine_id !== undefined && item.schedule_item.poultry_vaccine_id !== null ? toNumber(item.schedule_item.poultry_vaccine_id) : null,
            poultry_medication_id: item.schedule_item.poultry_medication_id !== undefined && item.schedule_item.poultry_medication_id !== null ? toNumber(item.schedule_item.poultry_medication_id) : null,
            dose: toNumber(item.schedule_item.dose),
            withdrawal_period_days: toNumber(item.schedule_item.withdrawal_period_days),
          } : undefined,
        }))
      })),
      batch_feeding_schedules: sanitizeArray(record.batch_feeding_schedules, (s: any) => ({
        ...s,
        id: toNumber(s.id),
        flock_id: toNumber(s.flock_id),
        feeding_schedule_id: toNumber(s.feeding_schedule_id),
        items: sanitizeArray(s.items, (item: any) => ({
          ...item,
          id: toNumber(item.id),
          feeding_batch_schedule_id: toNumber(item.feeding_batch_schedule_id),
          feeding_schedule_item_id: toNumber(item.feeding_schedule_item_id),
          actual_quantity: toNumber(item.actual_quantity),
          status: item.status,
          schedule_item: item.schedule_item ? {
            ...item.schedule_item,
            id: toNumber(item.schedule_item.id),
            feeding_schedule_id: toNumber(item.schedule_item.feeding_schedule_id),
            feed_type_id: toNumber(item.schedule_item.feed_type_id),
            quantity: toNumber(item.schedule_item.quantity),
          } : undefined,
        }))
      })),
      poultry_feed_usages: sanitizeArray(record.poultry_feed_usages, sanitizeFeedUsage),
      poultry_medication_records: sanitizeArray(record.poultry_medication_records, sanitizeMedicationRecord),
      poultry_vaccination_records: sanitizeArray(record.poultry_vaccination_records, sanitizeVaccinationRecord),
      flock_expenditures: sanitizeArray(record.flock_expenditures, sanitizeFlockExpenditure),
      flock_sales: sanitizeArray(record.flock_sales ?? record.flockSales, sanitizeFlockSale),
    };
    return sanitized;
  }

  // Overloaded function signatures for getFlocks
  export function getFlocks(token: string, farmId: number, paginated: true, page?: number, perPage?: number): Promise<PaginatedRequestType<FlockRecord>>;
  export function getFlocks(token: string, farmId: number, paginated?: false): Promise<RequestResponse<FlockRecord[]>>;
  export async function getFlocks(
    token: string, 
    farmId: number, 
    paginated: boolean = false, 
    page: number = 1, 
    perPage: number = 10
  ): Promise<PaginatedRequestType<FlockRecord> | RequestResponse<FlockRecord[]>> {
    try {
      let url = `/api/farms/${farmId}/flocks`;
      if (paginated) {
        url += `/paginated?page=${page}&perPage=${perPage}`;
      }
      
      const response = await axios.get(url, { headers: {"Authorization": `Bearer ${token}`} });
      
      if (response.status === 200) {
        if (paginated) {
          const sanitizedData = (response.data.data.data || []).map(sanitizeFlockRecord);
          return {
            success: true,
            data: sanitizedData,
            current_page: response.data.data.current_page,
            total_pages: response.data.data.last_page,
            per_page: response.data.data.per_page
          } as PaginatedRequestType<FlockRecord>;
        } else {
          const sanitizedData = (response.data.data || []).map(sanitizeFlockRecord);
          return {
            success: true,
            data: sanitizedData
          } as RequestResponse<FlockRecord[]>;
        }
      } else {
        return { 
          success: false,
          error: [`Error getting Flocks Data!!! ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Axios Request failed"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

 export const getFlock = async (token : string, farmId : number, flockId: number): Promise<RequestResponse<DetailedFlockRecord>> => {
    try {
      const response = await  axios.get(`/api/farms/${farmId}/flocks/${flockId}/get` , { headers: {"Authorization" : `Bearer ${token}`} })
      if(response.status === 200){
        return {
          success: true,
          data : sanitizeFlockRecord(response.data.data)
        }
      }else{
        return { 
          success : false,
          error: [`Error getting Flock Data!!! ${response.status}`]
         }
      }
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Exois Request failed"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

 export const updateFlockStatus = async (
  token: string,
  farmId: number,
  flockId: number,
  payload: {
    status: "sold" | "culled" | "completed"
    actual_end_date: string
  }
): Promise<RequestResponse<FlockRecord>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/flocks/${flockId}/status`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeFlockRecord(response.data.data),
      }
    }
    return {
      success: false,
      error: [`Error updating flock status! Status: ${response.status}`],
    }
  } catch (error: unknown) {
    console.error("Error updating flock status:", error)
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to close batch"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

  // Multi-pen allocations & transfer history
  export type FlockAllocationRow = {
    id?: number;
    farm_id: number;
    flock_id: number;
    house_id: number;
    quantity: number;
    house?: any;
  };

  export const getFlockAllocations = async (
    token: string,
    farmId: number,
    flockId: number
  ): Promise<RequestResponse<FlockAllocationRow[]>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/flocks/${flockId}/allocations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: [`Error getting allocations (${response.status})`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Request failed"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export type FlockTransferLinePayload = {
    from_house_id?: number | null;
    to_house_id?: number | null;
    quantity: number;
  };

  export type FlockTransferPayload = {
    transfer_date: string; // yyyy-mm-dd
    note?: string | null;
    lines: FlockTransferLinePayload[];
  };

  export type FlockTransferRecord = {
    id: number;
    farm_id: number;
    flock_id: number;
    transfer_date: string;
    note?: string | null;
    created_by?: number | null;
    createdBy?: any;
    lines: Array<{
      id: number;
      from_house_id?: number | null;
      to_house_id?: number | null;
      quantity: number;
      fromHouse?: any;
      toHouse?: any;
    }>;
  };

  export const getFlockTransfers = async (
    token: string,
    farmId: number,
    flockId: number
  ): Promise<RequestResponse<FlockTransferRecord[]>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/flocks/${flockId}/transfers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: [`Error getting transfers (${response.status})`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Request failed"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export const createFlockTransfer = async (
    token: string,
    farmId: number,
    flockId: number,
    payload: FlockTransferPayload
  ): Promise<RequestResponse<FlockTransferRecord>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/flocks/${flockId}/transfers`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 201 || response.status === 200) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: [`Transfer failed (${response.status})`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        const data = error.response?.data as any;
        const rawErrors = data?.errors;

        // Laravel validation errors may be returned as:
        // - { errors: string[] }
        // - { errors: { field: string[] } } (common for ValidationException)
        // Normalize to a string[] so the UI can always render toasts.
        let messages: string[] = [];
        if (Array.isArray(rawErrors)) {
          messages = rawErrors.map(String);
        } else if (rawErrors && typeof rawErrors === "object") {
          messages = Object.values(rawErrors).flatMap((v) =>
            Array.isArray(v) ? v.map(String) : [String(v)]
          );
        } else if (typeof data?.message === "string") {
          messages = [data.message];
        }

        return {
          success: false,
          error: messages.length ? messages : ["Transfer failed"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };
  // Flock-level notifications

  export type FlockNotifications = {
    upcoming_batch_items: Array<{
      id: number;
      schedule_item_id?: number;
      batch_schedule_id?: number;
      batch_schedule_item_id?: number | null;
      type: "medication" | "vaccination";
      title: string;
      vaccine_name?: string | null;
      scheduled_date: string;
      days_until: number;
      status: string | null;
      flock_name: string;
      cost?: number | null;
      age_days?: number;
      description?: string | null;
      dose?: number | null;
      dose_unit?: string | null;
      administration_method?: string | null;
      schedule_name?: string | null;
      poultry_vaccine_id?: number | null;
    }>;
    low_stock: {
      medications: Array<{
        id: number;
        name: string | null;
        quantity: number;
        status?: string | null;
        expiry_date?: string | null;
      }>;
      vaccines: Array<{
        id: number;
        name: string | null;
        quantity: number;
        status?: string | null;
        expiry_date?: string | null;
      }>;
      feeds: Array<{
        id: number;
        name: string | null;
        quantity: number;
        status?: string | null;
      }>;
    };
    settings?: {
      schedule_reminder_days: number;
      low_stock_alerts_enabled: boolean;
      mortality_alert_percent: number;
    };
  };

  export async function getFlockNotifications(
    token: string,
    farmId: number,
    flockId: number
  ): Promise<RequestResponse<FlockNotifications>> {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/flocks/${flockId}/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data as FlockNotifications,
        };
      }
      return {
        success: false,
        error: [`Error getting flock notifications: ${response.status}`],
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.errors ||
            [error.response?.data?.message] ||
            ["Failed to get flock notifications"],
        };
      }
      return {
        success: false,
        error: ["Failed to get flock notifications"],
      };
    }
  }

  // Overloaded function signatures for getSchedules
  export function getSchedules(
    token: string,
    farmId: number,
    type: "medication" | "vaccination",
    paginated: true,
    page?: number,
    perPage?: number
  ): Promise<PaginatedRequestType<DetailedSchedule[]>>;
  export function getSchedules(
    token: string,
    farmId: number,
    type: "medication" | "vaccination",
    paginated?: false
  ): Promise<RequestResponse<DetailedSchedule[]>>;
  export async function getSchedules(
    token: string,
    farmId: number,
    type: "medication" | "vaccination",
    paginated: boolean = false,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedRequestType<DetailedSchedule[]> | RequestResponse<DetailedSchedule[]>> {
    try {
      let url = `/api/farms/${farmId}/${type}/schedules`;
      if (paginated) {
        url += `/paginated?page=${page}&perPage=${perPage}&pagination=true`;
      } else {
        // Explicitly disable pagination so the backend can't fall back to paginated route defaults
        url += `?pagination=false`;
      }
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.status === 200) {
        if (paginated) {
          const payload = response.data.data;
          return {
            success: true,
            data: payload.data,
            current_page: payload.current_page,
            // Backend uses total + last_page; expose both total_records and total_pages
            total_records: payload.total,
            total_pages: payload.last_page ?? 1,
            per_page: payload.per_page,
          } as PaginatedRequestType<DetailedSchedule[]>;
        } else {
          // Handle both plain array and paginated object responses
          const raw = response.data.data;
          const data = Array.isArray(raw) ? raw : (raw?.data ?? []);
          return {
            success: true,
            data
          } as RequestResponse<DetailedSchedule[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error getting Schedules Data!!! ${response.status}`],
        };
      }
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Axios Request failed"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

  // export const getFlockVacinationSchedule = async (token : string, flockId: number): Promise<RequestResponse<DetailedFlockRecord>> => {
  //   try {
  //     const response = await  axios.get(`/api/farms/${farmId}/flocks/${flockId}/get` , { headers: {"Authorization" : `Bearer ${token}`} })
  //     if(response.status === 200){
  //       return {
  //         success: true,
  //         data : sanitizeFlockRecord(response.data.data)
  //       }
  //     }else{
  //       return { 
  //         success : false,
  //         error: [`Error getting Flock Data!!! ${response.status}`]
  //        }
  //     }
  //   } catch (error: unknown) {
  //     console.log(error);
  //     if (isAxiosError(error)) {
  //       return {
  //         success: false,
  //         error: error.response?.data?.errors || ["Exois Request failed"],
  //       };
  //     } else {
  //       return {
  //         success: false,
  //         error: ["An unexpected error occurred"],
  //       };
  //     }
  //   }
  // }

  export const createFlock = async (
    token: string,
    farmId: number,
    flockData: {
      name: string
      breed: string
      source: string
      quantity: number
      arrival_date: string
      arrival_age_days: number
      expected_end_date: string
      poultry_type_id: number
      flock_stage_id: number
      house_id: number
      notes: string
      medication_schedule_id?: number | null
      vaccination_schedule_id?: number | null
      feeding_schedule_id?: number | null
    }
  ): Promise<RequestResponse<FlockRecord>> => {
    try {
      // Remove batch_number if present
      const { batch_number, ...payload } = flockData as any;
      const response = await axios.post(
        `/api/farms/${farmId}/flocks`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: sanitizeFlockRecord(response.data.data)
        }
      } else {
        return {
          success: false,
          error: [`Error creating flock: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create flock"],
          code: error.response?.data?.code,
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export const updateFlock = async (
    token: string,
    farmId: number,
    flockId: number,
    flockData: {
      name?: string
      breed?: string
      source?: string
      quantity?: number
      arrival_date?: string
      arrival_age_days?: number
      expected_end_date?: string
      poultry_type_id?: number
      flock_stage_id?: number
      house_id?: number
      notes?: string
    }
  ): Promise<RequestResponse<FlockRecord>> => {
    try {
      const response = await axios.put(
        `/api/farms/${farmId}/flocks/${flockId}`,
        flockData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: sanitizeFlockRecord(response.data.data),
        }
      }
      return {
        success: false,
        error: [`Error updating flock: ${response.status}`],
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update flock"],
        }
      }
      return {
        success: false,
        error: ["An unexpected error occurred"],
      }
    }
  }

  export const getPoultryTypes = async (token: string, farmId: number): Promise<RequestResponse<PoultryType[]>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/poultry-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          error: [`Error getting poultry types: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Failed to get poultry types"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export type LiterTypeOption = {
    id: number;
    name: string;
    description?: string;
  };

  export const getLiterTypes = async (token: string): Promise<RequestResponse<LiterTypeOption[]>> => {
    try {
      const response = await axios.get(`/api/liter-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }

      return { success: false, error: [`Error getting liter types: ${response.status}`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Failed to get liter types"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export const getPoultryHouses = async (token: string, farmId: number): Promise<RequestResponse<PoultryHouse[]>> => {
    try {
      const response = await axios.get(
        `/api/poultry-houses/${farmId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          error: [`Error getting poultry houses: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Failed to get poultry houses"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export const createPoultryHouse = async (
    token: string,
    farmId: number,
    payload: Omit<PoultryHouse, "id" | "farm_id" | "created_at" | "updated_at" | "deleted_at">
  ): Promise<RequestResponse<PoultryHouse>> => {
    try {
      const response = await axios.post(
        `/api/poultry-houses/${farmId}`,
        { ...payload, farm_id: farmId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data };
      }
      return {
        success: false,
        error: [`Error creating poultry house: ${response.status}`],
      };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create poultry house"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export type HouseCapacityRule = {
    id?: number;
    farm_id?: number;
    house_id?: number;
    min_age_days: number;
    // null => open-ended range (age >= min_age_days)
    max_age_days: number | null;
    capacity: number;
  };

  export const getHouseCapacityRules = async (
    token: string,
    farmId: number,
    houseId: number
  ): Promise<RequestResponse<HouseCapacityRule[]>> => {
    try {
      const response = await axios.get(`/api/poultry-houses/${farmId}/${houseId}/capacity-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) return { success: true, data: response.data.data };
      return { success: false, error: [`Error loading capacity rules (${response.status})`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || ["Request failed"] };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export const updateHouseCapacityRules = async (
    token: string,
    farmId: number,
    houseId: number,
    rules: HouseCapacityRule[]
  ): Promise<RequestResponse<HouseCapacityRule[]>> => {
    try {
      const response = await axios.put(
        `/api/poultry-houses/${farmId}/${houseId}/capacity-rules`,
        { rules },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) return { success: true, data: response.data.data };
      return { success: false, error: [`Error saving capacity rules (${response.status})`] };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || ["Request failed"] };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export type AllowedCapacityResponse = {
    flock_id: number;
    age_days: number;
    default_capacity: number;
    allowed_capacity: number;
    matched_rule:
      | {
          id: number;
          min_age_days: number;
          max_age_days: number | null;
          capacity: number;
        }
      | null;
    is_fallback_default: boolean;
    current_occupancy: number;
    flock_size: number;
    attempted_occupancy: number;
    matched_band: string | null;
  };

  export const getAllowedHouseCapacity = async (
    token: string,
    farmId: number,
    houseId: number,
    flockId: number
  ): Promise<RequestResponse<AllowedCapacityResponse>> => {
    try {
      const response = await axios.get(
        `/api/poultry-houses/${farmId}/${houseId}/allowed-capacity`,
        {
          params: { flock_id: flockId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        return { success: true, data: response.data.data as AllowedCapacityResponse };
      }

      return {
        success: false,
        error: [`Error loading allowed capacity (${response.status})`],
      };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.errors ||
            (error.response?.data?.message ? [error.response.data.message] : undefined) ||
            ["Request failed"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export const updatePoultryHouse = async (
    token: string,
    farmId: number,
    houseId: number,
    payload: Partial<Omit<PoultryHouse, "id" | "farm_id" | "created_at" | "updated_at" | "deleted_at">>
  ): Promise<RequestResponse<PoultryHouse>> => {
    try {
      const response = await axios.put(
        `/api/poultry-houses/${farmId}/${houseId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }
      return {
        success: false,
        error: [`Error updating poultry house: ${response.status}`],
      };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update poultry house"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  export const deletePoultryHouse = async (
    token: string,
    farmId: number,
    houseId: number
  ): Promise<RequestResponse<null>> => {
    try {
      const response = await axios.delete(
        `/api/poultry-houses/${farmId}/${houseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: [`Error deleting poultry house: ${response.status}`],
      };
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete poultry house"],
        };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
  };

  // Overloaded function signatures for getFlockStages
  export function getFlockStages(
    token: string, 
    paginated: true, 
    page?: number, 
    perPage?: number
  ): Promise<PaginatedRequestType<FlockStage>>;
  export function getFlockStages(
    token: string, 
    paginated?: false
  ): Promise<RequestResponse<FlockStage[]>>;
  export async function getFlockStages(
    token: string, 
    paginated: boolean = false, 
    page: number = 1, 
    perPage: number = 10
  ): Promise<PaginatedRequestType<FlockStage> | RequestResponse<FlockStage[]>> {
    try {
      let url = `/api/flock-stages`;
      if (paginated) {
        url += `/paginated?page=${page}&perPage=${perPage}`;
      }
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.status === 200) {
        if (paginated) {
          return {
            success: true,
            data: response.data.data.data || [],
            current_page: response.data.data.current_page,
            total_pages: response.data.data.last_page,
            per_page: response.data.data.per_page
          } as PaginatedRequestType<FlockStage>;
        } else {
          return {
            success: true,
            data: response.data.data || []
          } as RequestResponse<FlockStage[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error getting flock stages: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Failed to get flock stages"]
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        };
      }
    }
  }

  export type DailyRecordInput = {
    date: string
    mortality: number
    culls: number
    feed_consumed_kg: number
    water_consumed_liters: number
    avg_weight_grams: number
    min_weight_grams: number
    max_weight_grams: number
    sample_size: number
    min_temperature: number
    max_temperature: number
    humidity: number
    light_hours: number
    eggs_collected: number
    eggs_broken: number
    notes: string
    poultry_feed_inventory_id?: number | null
  }

  export const createDailyRecord = async (
    token: string,
    farmId: number,
    flockId: number,
    recordData: DailyRecordInput
  ): Promise<RequestResponse<any>> => {
    try {
      const dataWithFlockId = {
        ...recordData,
        flock_id: flockId,
      }
      
      const response = await axios.post(
        `/api/farms/${farmId}/flock-daily-records`,
        dataWithFlockId,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: sanitizeDailyRecord(response.data.data)
        }
      } else {
        return {
          success: false,
          error: [`Error creating daily record: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create daily record"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export type DailyRecordBatchResult = {
    succeeded: number
    failed: Array<{ index: number; date: string; error: string }>
  }

  export const createDailyRecordsBatch = async (
    token: string,
    farmId: number,
    flockId: number,
    records: DailyRecordInput[]
  ): Promise<DailyRecordBatchResult> => {
    const indexed = records.map((record, index) => ({ record, index }))
    const sorted = [...indexed].sort((a, b) => a.record.date.localeCompare(b.record.date))

    let succeeded = 0
    const failed: DailyRecordBatchResult["failed"] = []

    for (const { record, index } of sorted) {
      const response = await createDailyRecord(token, farmId, flockId, record)
      if (response.success) {
        succeeded += 1
      } else {
        const errorMessage = Array.isArray(response.error)
          ? response.error.join(", ")
          : (typeof response.error === "string" ? response.error : "Failed to create daily record")
        failed.push({ index, date: record.date, error: errorMessage })
      }
    }

    return { succeeded, failed }
  }

  export const deleteDailyRecord = async (
    token: string,
    farmId: number,
    recordId: number
  ): Promise<RequestResponse<void>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/flock-daily-records/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 204) {
        return { success: true, data: undefined }
      }
      return {
        success: false,
        error: [`Error deleting daily record: ${response.status}`]
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete daily record"]
        }
      }
      return {
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }

  export const updateDailyRecord = async (
    token: string,
    farmId: number,
    recordId: number,
    recordData: DailyRecordInput
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.put(
        `/api/farms/${farmId}/flock-daily-records/${recordId}`,
        recordData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: sanitizeDailyRecord(response.data.data)
        }
      }
      return {
        success: false,
        error: [`Error updating daily record: ${response.status}`]
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update daily record"]
        }
      }
      return {
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }

  export const createMedicationRecord = async (
    token: string,
    farmId: number,
    recordData: {
      farm_id: number
      flock_id: number
      poultry_medication_id: number
      poultry_medication_inventory_id: number
      date: string
      administered_by: string
      dosage: number
      dosage_unit: string
      quantity: number
      cost: number
      notes: string
      administration_method_id: number
    }
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/medication-records`,
        recordData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          error: [`Error creating medication record: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create medication record"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export const deleteMedicationRecord = async (
    token: string,
    farmId: number,
    recordId: number
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/medication-records/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          error: [`Error deleting medication record: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      console.log(error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete medication record"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
      }
    }
  }

  export const deleteMortalityRecord = async (
    token: string,
    farmId: number,
    recordId: number
  ): Promise<RequestResponse<void>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/flock-mortality-reports/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.status === 200 || response.status === 204) {
        return { success: true, data: undefined }
      }

      return {
        success: false,
        error: [`Error deleting mortality record: ${response.status}`]
      }
    } catch (error: unknown) {
      console.error("Error deleting mortality record:", error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete mortality record"]
        }
      }
      return {
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }

  export const createMortalityRecord = async (
    token: string,
    farmId: number,
    recordData: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<RequestResponse<MortalityReport>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/flock-mortality-reports`,
        recordData,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: [`Error creating mortality record! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error creating mortality record:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to add mortality record"]
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  };

  export const createWeightReport = async (
    token: string,
    farmId: number,
    recordData: Omit<WeightReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<RequestResponse<WeightReport>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/flock-weight-reports`,
        recordData,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: sanitizeWeightReport(response.data.data)
        };
      } else {
        return {
          success: false,
          error: [`Error creating weight report! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error creating weight report:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to add weight report"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  };

  export const deleteWeightReport = async (
    token: string,
    farmId: number,
    recordId: number
  ): Promise<RequestResponse<void>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/flock-weight-reports/${recordId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          data: undefined
        };
      } else {
        return {
          success: false,
          error: [`Error deleting weight report! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error deleting weight report:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete weight report"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  };

  export type EggReportPayload = {
    flock_id: number;
    date: string;
    eggs_collected: number;
    eggs_broken?: number;
    average_egg_weight?: number;
    notes?: string;
  };

  export const createEggReport = async (
    token: string,
    farmId: number,
    recordData: EggReportPayload
  ): Promise<RequestResponse<EggReport>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/flock-egg-reports`,
        recordData,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: sanitizeEggReport(response.data.data),
        };
      }

      return {
        success: false,
        error: [`Error creating egg report! Status: ${response.status}`],
      };
    } catch (error: unknown) {
      console.error("Error creating egg report:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to add egg report"],
        };
      }
      return {
        success: false,
        error: ["An unexpected error occurred"],
      };
    }
  };

  export const updateEggReport = async (
    token: string,
    farmId: number,
    reportId: number,
    recordData: Partial<EggReportPayload>
  ): Promise<RequestResponse<EggReport>> => {
    try {
      const response = await axios.put(
        `/api/farms/${farmId}/flock-egg-reports/${reportId}`,
        recordData,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (response.status === 200) {
        return {
          success: true,
          data: sanitizeEggReport(response.data.data),
        };
      }

      return {
        success: false,
        error: [`Error updating egg report! Status: ${response.status}`],
      };
    } catch (error: unknown) {
      console.error("Error updating egg report:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update egg report"],
        };
      }
      return {
        success: false,
        error: ["An unexpected error occurred"],
      };
    }
  };

  export const deleteEggReport = async (
    token: string,
    farmId: number,
    reportId: number
  ): Promise<RequestResponse<void>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/flock-egg-reports/${reportId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          data: undefined,
        };
      }

      return {
        success: false,
        error: [`Error deleting egg report! Status: ${response.status}`],
      };
    } catch (error: unknown) {
      console.error("Error deleting egg report:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete egg report"],
        };
      }
      return {
        success: false,
        error: ["An unexpected error occurred"],
      };
    }
  };

  export const createFeedUsageRecord = async (
    token: string,
    farmId: number,
    recordData: Omit<PoultryFeedUsageRecord, 'id' | 'created_at' | 'updated_at' | 'feed_inventory' | 'feed_type' | 'flock'>
  ): Promise<RequestResponse<PoultryFeedUsageRecord>> => {
    try {
      const payload: Record<string, unknown> = { ...recordData }
      if (!payload.poultry_feed_inventory_id) {
        delete payload.poultry_feed_inventory_id
      }
      if (payload.unit_cost === undefined || payload.unit_cost === null || payload.unit_cost === "") {
        payload.unit_cost = 0
      }

      const response = await axios.post(
        `/api/farms/${farmId}/feed-usages`,
        payload,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: [`Error creating feed usage record! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error creating feed usage record:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to add feed usage record"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  };

export const updateFeedUsageRecord = async (
  token: string,
  farmId: number,
  usageId: number,
  payload: Partial<{
    poultry_feed_inventory_id: number
    move_quantity: number
    poultry_feed_type_id: number
    flock_id: number
    quantity: number
    unit_cost: number
    usage_date: string
  }>
): Promise<RequestResponse<PoultryFeedUsageRecord | { usage: PoultryFeedUsageRecord; split_usage?: PoultryFeedUsageRecord }>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feed-usages/${usageId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }

    return {
      success: false,
      error: [`Error updating feed usage record! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error("Error updating feed usage record:", error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to update feed usage record"],
      };
    }

    return { success: false, error: ["An unexpected error occurred"] };
  }
};

  // Add deleteFeedUsageRecord (was missing)
export const deleteFeedUsageRecord = async (
  token: string,
  farmId: number,
  recordId: number
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/feed-usages/${recordId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: [`Error deleting feed usage record: ${response.status}`] };
    }
  } catch (error: unknown) {
    console.error("Error deleting feed usage record:", error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed usage record"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const getFeedUsagesByInventory = async (
  token: string,
  farmId: number,
  inventoryId: number
): Promise<RequestResponse<PoultryFeedUsageRecord[]>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/feed-usages`,
      {
        params: { feed_inventory_id: inventoryId },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 200) {
      const raw = Array.isArray(response.data.data) ? response.data.data : [];
      const toNumber = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
      const sanitized = raw.map((r: any) => {
        const recorder = typeof r.creator === 'object' && r.creator !== null ? r.creator : null;
        return {
          ...r,
          id: toNumber(r.id),
          farm_id: toNumber(r.farm_id),
          poultry_feed_inventory_id: toNumber(r.poultry_feed_inventory_id),
          poultry_feed_type_id: toNumber(r.poultry_feed_type_id),
          flock_id: toNumber(r.flock_id),
          quantity: toNumber(r.quantity),
          unit_cost: toNumber(r.unit_cost),
          created_by: toNumber(r.created_by),
          flock: r.flock ? {
            id: toNumber(r.flock.id),
            name: r.flock.name ?? '',
            batch_number: r.flock.batch_number ?? '',
          } : undefined,
          feed_type: r.feed_type ? {
            ...r.feed_type,
            id: toNumber(r.feed_type.id),
            name: r.feed_type.name ?? '',
          } : undefined,
          recorded_by_name: recorder?.name ?? null,
          has_expenditure: Boolean(r.has_expenditure),
        } as PoultryFeedUsageRecord;
      });

      return { success: true, data: sanitized };
    }

    return {
      success: false,
      error: [`Error fetching feed usages: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error("Error fetching feed usages by inventory:", error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed usages"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const forceFeedUsageExpenditure = async (
  token: string,
  farmId: number,
  usageId: number
): Promise<RequestResponse<{ created: boolean; has_expenditure: boolean }>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-usages/${usageId}/force-expenditure`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: {
          created: Boolean(response.data?.data?.created),
          has_expenditure: Boolean(response.data?.data?.has_expenditure ?? true),
        },
      };
    }

    return {
      success: false,
      error: [`Error forcing feed usage expenditure! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error("Error forcing feed usage expenditure:", error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to force feed usage expenditure"],
      };
    }

    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const createFlockExpenditure = async (
  token: string,
  farmId: number,
  flockId: number,
  payload: {
    category: string;
    amount: number;
    currency?: string | null;
    description?: string | null;
    payment_method?: string | null;
    reference_no?: string | null;
    date: string;
  }
): Promise<RequestResponse<FlockExpenditure>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/expenditures`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: sanitizeFlockExpenditure(response.data.data) };
    }
    return {
      success: false,
      error: [`Error creating flock expenditure! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error('Error creating flock expenditure:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to add flock expenditure'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const updateFlockExpenditure = async (
  token: string,
  farmId: number,
  flockId: number,
  expenditureId: number,
  payload: {
    category?: string;
    amount?: number;
    currency?: string | null;
    description?: string | null;
    payment_method?: string | null;
    reference_no?: string | null;
    date?: string;
  }
): Promise<RequestResponse<FlockExpenditure>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/flocks/${flockId}/expenditures/${expenditureId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: sanitizeFlockExpenditure(response.data.data) };
    }
    return {
      success: false,
      error: [`Error updating flock expenditure! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error('Error updating flock expenditure:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to update flock expenditure'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export type FlockExpenditureFilters = {
  category?: string;
  date_from?: string;
  date_to?: string;
  source?: 'manual' | 'auto';
  search?: string;
};

export const getFlockExpenditures = async (
  token: string,
  farmId: number,
  flockId: number,
  filters: FlockExpenditureFilters = {}
): Promise<RequestResponse<FlockExpenditure[]>> => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.source) params.set('source', filters.source);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();

    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/expenditures${query ? `?${query}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        success: true,
        data: rows.map((row: unknown) => sanitizeFlockExpenditure(row)).filter(Boolean) as FlockExpenditure[],
      };
    }
    return { success: false, error: [`Error fetching expenditures: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch flock expenditures'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const getFlockExpenditureSummary = async (
  token: string,
  farmId: number,
  flockId: number,
  filters: FlockExpenditureFilters = {}
): Promise<RequestResponse<FlockExpenditureSummary>> => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.source) params.set('source', filters.source);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();

    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/expenditures/summary${query ? `?${query}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data as FlockExpenditureSummary };
    }
    return { success: false, error: [`Error fetching expenditure summary: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch expenditure summary'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export type BatchActivityCategory =
  | "feeding"
  | "feed_consumption"
  | "medication"
  | "deworming"
  | "vaccination"
  | "mortality"
  | "weighing"
  | "egg_production"
  | "water_consumption"
  | "transfer"
  | "sale"
  | "task"
  | "daily_record";

export type BatchActivityRow = {
  id: string;
  date: string;
  activity: string;
  category: BatchActivityCategory;
  description: string;
  quantity: number | null;
  unit: string | null;
  performed_by: string | null;
  status: string;
  source_type: string;
  source_id: number;
};

export type BatchActivitySummary = {
  total_activities: number;
  feed_consumed_kg?: number;
  feed_planned_kg?: number;
  medication_count?: number;
  deworming_count?: number;
  vaccination_count?: number;
  mortality_count?: number;
  tasks_completed?: number;
  egg_total?: number;
  water_liters?: number;
  feeding_count?: number;
  transfer_count?: number;
  birds_sold?: number;
};

export type BatchActivityReportMeta = {
  batch: {
    id: number;
    name: string;
    batch_number: string | null;
    poultry_type: string | null;
    arrival_date: string;
    batch_week: number;
    current_age_days: number;
  };
  date_range: { from: string; to: string; label: string };
  farm_name: string;
  generated_at: string;
  summary: BatchActivitySummary;
  activities: {
    data: BatchActivityRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type FlockActivityFilters = {
  start_date: string;
  end_date: string;
  activity_type?: BatchActivityCategory | "";
  search?: string;
  page?: number;
  per_page?: number;
};

export const getFlockActivities = async (
  token: string,
  farmId: number,
  flockId: number,
  filters: FlockActivityFilters
): Promise<RequestResponse<BatchActivityReportMeta>> => {
  try {
    const params = new URLSearchParams();
    params.set("start_date", filters.start_date);
    params.set("end_date", filters.end_date);
    if (filters.activity_type) params.set("activity_type", filters.activity_type);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));

    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/activities?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data as BatchActivityReportMeta };
    }
    return { success: false, error: [`Error fetching activities: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to fetch flock activities"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const fetchAllFlockActivities = async (
  token: string,
  farmId: number,
  flockId: number,
  filters: Omit<FlockActivityFilters, "page" | "per_page">
): Promise<BatchActivityRow[]> => {
  const perPage = 100;
  let page = 1;
  let lastPage = 1;
  const rows: BatchActivityRow[] = [];

  do {
    const result = await getFlockActivities(token, farmId, flockId, {
      ...filters,
      page,
      per_page: perPage,
    });
    if (!result.success || !result.data) {
      throw new Error(result.error?.[0] ?? "Failed to fetch activities");
    }
    rows.push(...(result.data.activities.data ?? []));
    lastPage = result.data.activities.last_page ?? 1;
    page += 1;
  } while (page <= lastPage && page <= 10);

  return rows;
};

export const deleteFlockExpenditure = async (
  token: string,
  farmId: number,
  flockId: number,
  expenditureId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/flocks/${flockId}/expenditures/${expenditureId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Error deleting expenditure: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to delete flock expenditure'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const createFlockSale = async (
  token: string,
  farmId: number,
  flockId: number,
  payload: {
    quantity: number;
    unit_price: number;
    date: string;
    customer_id?: number | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    notes?: string | null;
  }
): Promise<RequestResponse<FlockSale>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/sales`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: sanitizeFlockSale(response.data.data) };
    }
    return {
      success: false,
      error: [`Error creating flock sale! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error('Error creating flock sale:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to record flock sale'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const updateFlockSale = async (
  token: string,
  farmId: number,
  flockId: number,
  saleId: number,
  payload: {
    quantity?: number;
    unit_price?: number;
    date?: string;
    customer_id?: number | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    notes?: string | null;
  }
): Promise<RequestResponse<FlockSale>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/flocks/${flockId}/sales/${saleId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: sanitizeFlockSale(response.data.data) };
    }
    return {
      success: false,
      error: [`Error updating flock sale! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error('Error updating flock sale:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to update flock sale'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const deleteFlockSale = async (
  token: string,
  farmId: number,
  flockId: number,
  saleId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/flocks/${flockId}/sales/${saleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return {
      success: false,
      error: [`Error deleting flock sale! Status: ${response.status}`],
    };
  } catch (error: unknown) {
    console.error('Error deleting flock sale:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to delete flock sale'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const getFlockProfitLoss = async (
  token: string,
  farmId: number,
  flockId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<RequestResponse<FlockProfitLoss>> => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/profit-loss${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const data = response.data.data;
      return {
        success: true,
        data: {
          ...data,
          flock_id: toNumber(data.flock_id),
          total_revenue: toNumber(data.total_revenue),
          live_bird_revenue: toNumber(data.live_bird_revenue),
          product_revenue: toNumber(data.product_revenue),
          total_cost: toNumber(data.total_cost),
          net_profit: toNumber(data.net_profit),
          margin_percent: toNumber(data.margin_percent),
          birds_sold: toNumber(data.birds_sold),
          average_sale_price: toNumber(data.average_sale_price),
          revenue_by_type: data.revenue_by_type
            ? {
                live_bird: toNumber(data.revenue_by_type.live_bird),
                egg: toNumber(data.revenue_by_type.egg),
                meat: toNumber(data.revenue_by_type.meat),
                manure: toNumber(data.revenue_by_type.manure),
              }
            : undefined,
        },
      };
    }
    return { success: false, error: [`Error fetching flock P&L! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching flock profit and loss:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch flock profit and loss'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const getFlockPerformanceMetrics = async (
  token: string,
  farmId: number,
  flockId: number
): Promise<RequestResponse<FlockPerformanceMetrics>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/performance`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const data = response.data.data;
      return {
        success: true,
        data: {
          mortality_rate: toNumber(data.mortality_rate),
          feed_conversion_ratio: toNumber(data.feed_conversion_ratio),
          egg_production_rate: toNumber(data.egg_production_rate),
          weight_gain_rate: toNumber(data.weight_gain_rate),
        },
      };
    }
    return { success: false, error: [`Error fetching flock performance metrics! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching flock performance metrics:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch flock performance metrics'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

const sanitizeFlockAiInsights = (raw: unknown): FlockMetricsAiResponse['ai_insights'] => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const score = String(data.performance_score ?? 'fair').toLowerCase();
  const performanceScore = (['good', 'fair', 'poor'] as const).includes(score as 'good' | 'fair' | 'poor')
    ? (score as 'good' | 'fair' | 'poor')
    : 'fair';

  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const row = item as Record<string, unknown>;
          const priority = String(row.priority ?? 'medium').toLowerCase();
          return {
            priority: (['high', 'medium', 'low'] as const).includes(priority as 'high' | 'medium' | 'low')
              ? (priority as 'high' | 'medium' | 'low')
              : 'medium',
            action: String(row.action ?? ''),
            reason: String(row.reason ?? ''),
          };
        })
        .filter((item) => item.action)
    : [];

  return {
    executive_summary: String(data.executive_summary ?? ''),
    performance_score: performanceScore,
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    risks: Array.isArray(data.risks) ? data.risks.map(String) : [],
    recommendations,
    benchmark_comparison: data.benchmark_comparison != null ? String(data.benchmark_comparison) : null,
  };
};

export const getFlockMetricsAiInsights = async (
  token: string,
  farmId: number,
  flockId: number
): Promise<RequestResponse<FlockMetricsAiResponse>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/metrics/ai-insights`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const data = response.data.data ?? {};
      return {
        success: true,
        data: {
          metrics_snapshot: (data.metrics_snapshot ?? {}) as Record<string, unknown>,
          ai_insights: sanitizeFlockAiInsights(data.ai_insights),
          ai_analysis: data.ai_analysis != null ? String(data.ai_analysis) : null,
          ai_available: Boolean(data.ai_available),
        },
      };
    }
    return { success: false, error: [`Error fetching flock AI insights! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching flock AI insights:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch flock AI insights'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const sanitizeComparativeMetrics = (raw: unknown): FlockComparativeMetrics => {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    mortality_rate_percent: toNumber(data.mortality_rate_percent),
    survival_rate_percent: toNumber(data.survival_rate_percent),
    days_in_flock: toNumber(data.days_in_flock),
    age_days: toNumber(data.age_days),
    feed_kg: toNumber(data.feed_kg),
    feed_per_bird_kg: toNumber(data.feed_per_bird_kg),
    feed_conversion_ratio: toNullableNumber(data.feed_conversion_ratio),
    weight_gain_rate_g_per_day: toNumber(data.weight_gain_rate_g_per_day),
    latest_weight_g: toNullableNumber(data.latest_weight_g),
    egg_production_rate_percent: toNumber(data.egg_production_rate_percent),
    total_eggs: toNumber(data.total_eggs),
    total_revenue: toNumber(data.total_revenue),
    total_cost: toNumber(data.total_cost),
    net_profit: toNumber(data.net_profit),
    margin_percent: toNumber(data.margin_percent),
    cost_per_bird: toNumber(data.cost_per_bird),
    birds_sold: toNumber(data.birds_sold),
  };
};

const sanitizeComparativeRow = (raw: unknown): FlockComparativeRow => {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    name: String(data.name ?? ''),
    batch_number: String(data.batch_number ?? ''),
    status: String(data.status ?? ''),
    breed: data.breed != null ? String(data.breed) : undefined,
    metrics: sanitizeComparativeMetrics(data.metrics),
  };
};

const sanitizeComparativeAggregate = (raw: unknown): FlockComparativeAggregate => {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    target: toNullableNumber(data.target),
    avg: toNullableNumber(data.avg),
    min: toNullableNumber(data.min),
    max: toNullableNumber(data.max),
    median: toNullableNumber(data.median),
    rank: toNullableNumber(data.rank),
    percentile: toNullableNumber(data.percentile),
    delta_vs_avg: toNullableNumber(data.delta_vs_avg),
    peer_count: toNumber(data.peer_count),
  };
};

const sanitizeComparativeAiInsights = (raw: unknown): FlockComparativeAiInsights | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const rec = item as Record<string, unknown>;
          const priority = String(rec.priority ?? 'medium');
          return {
            priority: (['high', 'medium', 'low'].includes(priority) ? priority : 'medium') as 'high' | 'medium' | 'low',
            action: String(rec.action ?? ''),
            reason: String(rec.reason ?? ''),
          };
        })
        .filter((item) => item.action)
    : [];

  return {
    executive_summary: String(data.executive_summary ?? ''),
    peer_ranking_summary: String(data.peer_ranking_summary ?? ''),
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    gaps: Array.isArray(data.gaps) ? data.gaps.map(String) : [],
    recommendations,
  };
};

const sanitizeComparativeReport = (raw: unknown): FlockComparativeReport => {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind = String(data.poultry_kind ?? 'other');
  const poultryKind = (['broiler', 'layer', 'dual', 'other'].includes(kind) ? kind : 'other') as FlockComparativeReport['poultry_kind'];
  const aggregatesRaw = (data.aggregates && typeof data.aggregates === 'object' ? data.aggregates : {}) as Record<string, unknown>;
  const aggregates = Object.fromEntries(
    Object.entries(aggregatesRaw).map(([key, value]) => [key, sanitizeComparativeAggregate(value)])
  );
  const highlightsRaw = (data.highlights && typeof data.highlights === 'object' ? data.highlights : {}) as Record<string, unknown>;

  return {
    cached: Boolean(data.cached),
    generated_at: data.generated_at != null ? String(data.generated_at) : null,
    peer_count: toNumber(data.peer_count),
    poultry_type: String(data.poultry_type ?? ''),
    poultry_kind: poultryKind,
    target_flock: sanitizeComparativeRow(data.target_flock),
    peers: Array.isArray(data.peers) ? data.peers.map(sanitizeComparativeRow) : [],
    aggregates,
    highlights: {
      strengths: Array.isArray(highlightsRaw.strengths) ? highlightsRaw.strengths.map(String) : [],
      gaps: Array.isArray(highlightsRaw.gaps) ? highlightsRaw.gaps.map(String) : [],
    },
    ai_insights: sanitizeComparativeAiInsights(data.ai_insights),
  };
};

export const getFlockComparativeMetrics = async (
  token: string,
  farmId: number,
  flockId: number
): Promise<RequestResponse<FlockComparativeReport>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/metrics/comparative`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeComparativeReport(response.data.data),
      };
    }
    return { success: false, error: [`Error fetching comparative metrics! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching comparative metrics:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch comparative metrics'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const refreshFlockComparativeMetrics = async (
  token: string,
  farmId: number,
  flockId: number
): Promise<RequestResponse<FlockComparativeReport>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/metrics/comparative`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeComparativeReport(response.data.data),
      };
    }
    return { success: false, error: [`Error refreshing comparative metrics! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error refreshing comparative metrics:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to refresh comparative metrics'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const getFarmSalesProfitLoss = async (
  token: string,
  farmId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<RequestResponse<FarmSalesProfitLoss>> => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(
      `/api/farms/${farmId}/sales-statistics${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const data = response.data.data;
      return {
        success: true,
        data: {
          ...data,
          total_revenue: toNumber(data.total_revenue),
          total_cost: toNumber(data.total_cost),
          net_profit: toNumber(data.net_profit),
          margin_percent: toNumber(data.margin_percent),
          birds_sold: toNumber(data.birds_sold),
          revenue_by_type: data.revenue_by_type
            ? {
                live_bird: toNumber(data.revenue_by_type.live_bird),
                egg: toNumber(data.revenue_by_type.egg),
                meat: toNumber(data.revenue_by_type.meat),
                manure: toNumber(data.revenue_by_type.manure),
              }
            : undefined,
          time_series: (data.time_series || []).map((row: any) => ({
            ...row,
            revenue: toNumber(row.revenue),
            cost: toNumber(row.cost),
            net_profit: toNumber(row.net_profit),
            revenue_live_bird: toNumber(row.revenue_live_bird),
            revenue_products: toNumber(row.revenue_products),
          })),
          cost_by_category: (data.cost_by_category || []).map((row: any) => ({
            ...row,
            total_cost: toNumber(row.total_cost),
          })),
          flocks: (data.flocks || []).map((row: any) => ({
            ...row,
            flock_id: toNumber(row.flock_id),
            live_bird_revenue: toNumber(row.live_bird_revenue),
            product_revenue: toNumber(row.product_revenue),
            total_revenue: toNumber(row.total_revenue),
            total_cost: toNumber(row.total_cost),
            net_profit: toNumber(row.net_profit),
            birds_sold: toNumber(row.birds_sold),
          })),
        },
      };
    }
    return { success: false, error: [`Error fetching sales P&L! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching farm sales profit and loss:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch sales profit and loss'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export type ProductSaleFormPayload = {
  type: 'egg' | 'meat' | 'manure';
  flock_id?: number | null;
  quantity: number;
  unit_price: number;
  date: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method?: string | null;
  payment_status?: 'pending' | 'paid' | 'partial';
  amount_paid?: number;
  notes?: string | null;
};

const mapSalesRecord = (data: any): SalesRecord => ({
  ...data,
  id: toNumber(data.id),
  farm_id: toNumber(data.farm_id),
  flock_id: data.flock_id == null ? null : toNumber(data.flock_id),
  quantity: toNumber(data.quantity),
  unit_price: toNumber(data.unit_price),
  total_amount: toNumber(data.total_amount),
  amount_paid: toNumber(data.amount_paid ?? 0),
});

export const getSalesRecords = async (
  token: string,
  farmId: number,
  params?: { type?: string; flock_id?: number; date_from?: string; date_to?: string }
): Promise<RequestResponse<SalesRecord[]>> => {
  try {
    const search = new URLSearchParams();
    if (params?.type) search.set('type', params.type);
    if (params?.flock_id) search.set('flock_id', String(params.flock_id));
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    const query = search.toString() ? `?${search.toString()}` : '';
    const response = await axios.get(`/api/farms/${farmId}/sales-records${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return { success: true, data: rows.map(mapSalesRecord) };
    }
    return { success: false, error: [`Error fetching product sales: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to fetch product sales'],
      };
    }
    return { success: false, error: ['Failed to fetch product sales'] };
  }
};

export type EggStockSummary = {
  produced: number;
  broken: number;
  sold: number;
  available: number;
  as_of: string;
};

export const getEggStock = async (
  token: string,
  farmId: number,
  params: { flock_id: number; date?: string; exclude_record_id?: number }
): Promise<RequestResponse<EggStockSummary>> => {
  try {
    const search = new URLSearchParams();
    search.set('flock_id', String(params.flock_id));
    if (params.date) search.set('date', params.date);
    if (params.exclude_record_id != null) {
      search.set('exclude_record_id', String(params.exclude_record_id));
    }
    const response = await axios.get(`/api/farms/${farmId}/sales-records/egg-stock?${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200 && response.data?.data) {
      const d = response.data.data;
      return {
        success: true,
        data: {
          produced: toNumber(d.produced),
          broken: toNumber(d.broken),
          sold: toNumber(d.sold),
          available: toNumber(d.available),
          as_of: String(d.as_of ?? params.date ?? ''),
        },
      };
    }
    return { success: false, error: [`Error fetching egg stock: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to fetch egg stock'],
      };
    }
    return { success: false, error: ['Failed to fetch egg stock'] };
  }
};

export const createSalesRecord = async (
  token: string,
  farmId: number,
  payload: ProductSaleFormPayload
): Promise<RequestResponse<SalesRecord>> => {
  try {
    const response = await axios.post(`/api/farms/${farmId}/sales-records`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: mapSalesRecord(response.data.data) };
    }
    return { success: false, error: [`Error creating product sale: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to create product sale'],
      };
    }
    return { success: false, error: ['Failed to create product sale'] };
  }
};

export const updateSalesRecord = async (
  token: string,
  farmId: number,
  recordId: number,
  payload: Partial<ProductSaleFormPayload>
): Promise<RequestResponse<SalesRecord>> => {
  try {
    const response = await axios.put(`/api/farms/${farmId}/sales-records/${recordId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: mapSalesRecord(response.data.data) };
    }
    return { success: false, error: [`Error updating product sale: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to update product sale'],
      };
    }
    return { success: false, error: ['Failed to update product sale'] };
  }
};

export const deleteSalesRecord = async (
  token: string,
  farmId: number,
  recordId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/sales-records/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Error deleting product sale: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to delete product sale'],
      };
    }
    return { success: false, error: ['Failed to delete product sale'] };
  }
};

export const getCustomers = async (
  token: string,
  farmId: number
): Promise<RequestResponse<Array<{ id: number; name: string; email?: string | null; phone?: string | null }>>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data || [] };
    }
    return { success: false, error: [`Error fetching customers: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ['Failed to fetch customers'],
      };
    }
    return { success: false, error: ['Failed to fetch customers'] };
  }
};

const sanitizeDashboardKpis = (raw: any): DashboardKpis => {
  const n = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
  return {
    total_birds: n(raw?.total_birds),
    active_birds: n(raw?.active_birds),
    active_flocks: n(raw?.active_flocks),
    total_flocks: n(raw?.total_flocks),
    feed_kg: n(raw?.feed_kg),
    feed_cost: n(raw?.feed_cost),
    eggs: n(raw?.eggs),
    mortality: n(raw?.mortality),
    mortality_rate_percent: n(raw?.mortality_rate_percent),
    fcr: n(raw?.fcr),
    revenue: n(raw?.revenue),
    cost: n(raw?.cost),
    net_profit: n(raw?.net_profit),
    margin_percent: n(raw?.margin_percent),
    cost_per_bird: n(raw?.cost_per_bird),
  };
};

const sanitizeFarmAlerts = (raw: any): FarmAlerts => {
  const n = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
  return {
    counts: {
      critical: n(raw?.counts?.critical),
      warning: n(raw?.counts?.warning),
      info: n(raw?.counts?.info),
    },
    items: (raw?.items || []).map((item: any) => ({
      id: String(item.id),
      severity: item.severity,
      category: item.category,
      title: item.title,
      detail: item.detail,
      date: item.date ?? null,
      flock_id: item.flock_id == null ? null : n(item.flock_id),
      flock_name: item.flock_name ?? null,
      link: item.link ?? null,
    })),
    settings: raw?.settings
      ? {
          schedule_reminder_days: n(raw.settings.schedule_reminder_days),
          low_stock_alerts_enabled: Boolean(raw.settings.low_stock_alerts_enabled),
          mortality_alert_percent: n(raw.settings.mortality_alert_percent),
        }
      : undefined,
  };
};

export const getFarmDashboard = async (
  token: string,
  farmId: number,
  options?: {
    preset?: DashboardDatePreset;
    start_date?: string;
    end_date?: string;
  }
): Promise<RequestResponse<FarmDashboard>> => {
  try {
    const params = new URLSearchParams();
    if (options?.start_date && options?.end_date) {
      params.set('start_date', options.start_date);
      params.set('end_date', options.end_date);
    } else if (options?.preset && options.preset !== 'custom') {
      params.set('preset', options.preset);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(`/api/farms/${farmId}/dashboard${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
      const data = response.data.data;
      const n = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
      return {
        success: true,
        data: {
          meta: {
            start_date: data.meta.start_date,
            end_date: data.meta.end_date,
            period_days: n(data.meta.period_days),
            previous_start_date: data.meta.previous_start_date,
            previous_end_date: data.meta.previous_end_date,
            generated_at: data.meta.generated_at,
          },
          kpis: sanitizeDashboardKpis(data.kpis),
          previous_period: sanitizeDashboardKpis(data.previous_period),
          series: (data.series || []).map((row: any) => ({
            date: row.date,
            feed_kg: n(row.feed_kg),
            feed_cost: n(row.feed_cost),
            eggs: n(row.eggs),
            mortality: n(row.mortality),
            mortality_rate: n(row.mortality_rate),
            revenue: n(row.revenue),
            cost: n(row.cost),
            net_profit: n(row.net_profit),
          })),
          flock_distribution: (data.flock_distribution || []).map((row: any) => ({
            type_id: n(row.type_id),
            type_name: row.type_name,
            birds: n(row.birds),
            flock_count: n(row.flock_count),
            percent: n(row.percent),
          })),
          flocks: (data.flocks || []).map((row: any) => ({
            id: n(row.id),
            name: row.name,
            batch_number: row.batch_number ?? null,
            poultry_type: row.poultry_type,
            status: row.status,
            age_days: n(row.age_days),
            birds: n(row.birds),
            mortality_percent: n(row.mortality_percent),
            fcr: n(row.fcr),
            feed_kg: n(row.feed_kg),
            feed_cost: n(row.feed_cost),
            revenue: n(row.revenue),
            net_profit: n(row.net_profit),
          })),
          cost_by_category: (data.cost_by_category || []).map((row: any) => ({
            category: row.category,
            total_cost: n(row.total_cost),
          })),
          alerts: sanitizeFarmAlerts(data.alerts),
        },
      };
    }
    return { success: false, error: [`Error fetching farm dashboard! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching farm dashboard:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch farm dashboard'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

export const getFarmAlerts = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmAlerts>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: sanitizeFarmAlerts(response.data.data) };
    }
    return { success: false, error: [`Error fetching farm alerts! Status: ${response.status}`] };
  } catch (error: unknown) {
    console.error('Error fetching farm alerts:', error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to fetch farm alerts'],
      };
    }
    return { success: false, error: ['An unexpected error occurred'] };
  }
};

  // Overloaded function signatures for getFeedInventories
  export function getFeedInventories(
    token: string,
    farmId: number,
    paginated: true,
    page?: number,
    perPage?: number
  ): Promise<PaginatedRequestType<FeedInventoryType>>;
  export function getFeedInventories(
    token: string,
    farmId: number,
    paginated?: false
  ): Promise<RequestResponse<FeedInventoryType[]>>;
  export async function getFeedInventories(
    token: string,
    farmId: number,
    paginated: boolean = false,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedRequestType<FeedInventoryType> | RequestResponse<FeedInventoryType[]>> {
    try {
      let url = `/api/farms/${farmId}/feed-inventories`;
      if (paginated) {
        url += `/paginated?page=${page}&perPage=${perPage}`;
      }
      
      const response = await axios.get(url, { headers: { "Authorization": `Bearer ${token}` } });
      
      if (response.status === 200) {
        if (paginated) {
          const sanitizedData = response.data.data.data || [];
          return {
            success: true,
            data: sanitizedData,
            current_page: response.data.data.current_page,
            total_pages: response.data.data.last_page,
            per_page: response.data.data.per_page
          } as PaginatedRequestType<FeedInventoryType>;
        } else {
          return {
            success: true,
            data: response.data.data || []
          } as RequestResponse<FeedInventoryType[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error fetching feed inventories! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error fetching feed inventories:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed inventories"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

  // Overloaded function signatures for getFeedTypes
  export function getFeedTypes(
    token: string,
    farmId: number,
    poultryTypeId: number,
    paginated: true,
    page?: number,
    perPage?: number
  ): Promise<PaginatedRequestType<FeedType>>;
  export function getFeedTypes(
    token: string,
    farmId: number,
    poultryTypeId: number,
    paginated?: false
  ): Promise<RequestResponse<FeedType[]>>;
  export async function getFeedTypes(
    token: string,
    farmId: number,
    poultryTypeId: number,
    paginated: boolean = false,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedRequestType<FeedType> | RequestResponse<FeedType[]>> {
    try {
      let url = `/api/farms/${farmId}/feed-types/${poultryTypeId}`;
      if (paginated) {
        url += `/paginated?page=${page}&perPage=${perPage}`;
      }
      
      const response = await axios.get(url, { headers: { "Authorization": `Bearer ${token}` } });
      
      if (response.status === 200) {
        console.log('Fetched feed types successfully:', response.data.data);
        if (paginated) {
          const sanitizedData = response.data.data.data || [];
          return {
            success: true,
            data: sanitizedData,
            current_page: response.data.data.current_page,
            total_pages: response.data.data.last_page,
            per_page: response.data.data.per_page
          } as PaginatedRequestType<FeedType>;
        } else {
          return {
            success: true,
            data: response.data.data || []
          } as RequestResponse<FeedType[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error fetching feed types! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error fetching feed types:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed types"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

  // Fetch feed products (moved here from requestProducts.ts)
export async function getFeedProducts(
  token: string,
  farmId: number,
  poultryFeedTypeId?: number,
  paginated: boolean = false,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<PoultryFeedProduct> | RequestResponse<PoultryFeedProduct[]>> {
  try {
    let url = `/api/farms/${farmId}/feed-products`;
    const params: string[] = [];
    if (poultryFeedTypeId !== undefined && poultryFeedTypeId !== null) params.push(`poultry_feed_type_id=${poultryFeedTypeId}`);
    if (paginated) params.push(`paginated=true&page=${page}&per_page=${perPage}`);
    if (params.length) url += `?${params.join('&')}`;

    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200) {
      if (paginated) {
        return {
          success: true,
          data: response.data.data.data || [],
          current_page: response.data.data.current_page,
          total_pages: response.data.data.last_page,
          per_page: response.data.data.per_page,
        }
      }

      return { success: true, data: response.data.data || [] }
    }

    return { success: false, error: [`Unexpected status ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed products"] }
    }
    return { success: false, error: ["Failed to fetch feed products"] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Schedule Import Drafts (PDF/Image -> Draft -> Confirm)
// ─────────────────────────────────────────────────────────────────────────────

export type CreateScheduleImportResponse = RequestResponse<{
  draft: any;
  ai_available: boolean;
  warnings: string[];
}>;

export const createScheduleImportDraft = async (
  token: string,
  farmId: number,
  file: File,
  poultryTypeId: number
): Promise<CreateScheduleImportResponse> => {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("poultry_type_id", String(poultryTypeId));

    const response = await axios.post(`/api/farms/${farmId}/ai/schedule-imports`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error creating import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const updateScheduleImportDraft = async (
  token: string,
  farmId: number,
  draftId: number,
  payload: { items: any[]; feeding_layout?: "range" | "per_day" }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(`/api/farms/${farmId}/ai/schedule-imports/${draftId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error updating import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const getScheduleImportDraft = async (
  token: string,
  farmId: number,
  draftId: number
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/ai/schedule-imports/${draftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error fetching import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const extractScheduleImportDraft = async (
  token: string,
  farmId: number,
  draftId: number,
  poultryTypeId: number
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/ai/schedule-imports/${draftId}/extract`,
      { poultry_type_id: poultryTypeId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error extracting import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to extract import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const deleteScheduleImportDraft = async (
  token: string,
  farmId: number,
  draftId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/ai/schedule-imports/${draftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Error deleting import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const confirmScheduleImportDraft = async (
  token: string,
  farmId: number,
  draftId: number,
  payload: {
    poultry_type_id: number;
    medication_schedule_name?: string;
    medication_schedule_description?: string;
    vaccination_schedule_name?: string;
    feeding_schedule_title?: string;
    vaccination_schedule_description?: string;
    feeding_schedule_description?: string;
  }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(`/api/farms/${farmId}/ai/schedule-imports/${draftId}/confirm`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error confirming import draft: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to confirm import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Flock record bulk import (AI + Excel/CSV)
// ─────────────────────────────────────────────────────────────────────────────

export const downloadFlockRecordImportTemplate = async (
  token: string,
  farmId: number,
  flockId: number
): Promise<RequestResponse<Blob>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/template`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );
    if (response.status === 200) {
      return { success: true, data: response.data as Blob };
    }
    return { success: false, error: [`Error downloading template: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: [error.response?.data?.message || "Failed to download template"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const createFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  file: File,
  method: "file" | "ai"
): Promise<
  RequestResponse<{
    draft: import("./types").FlockRecordImportDraft;
    ai_available: boolean;
    warnings: string[];
  }>
> => {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("method", method);
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error creating import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to create import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const getFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  draftId: number
): Promise<RequestResponse<import("./types").FlockRecordImportDraft>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/${draftId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error loading import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: [error.response?.data?.message || "Failed to load import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const updateFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  draftId: number,
  payload: {
    items: Array<{
      id?: number;
      record_type: string;
      payload: Record<string, unknown>;
      confidence?: number | null;
    }>;
    replace_all?: boolean;
  }
): Promise<RequestResponse<import("./types").FlockRecordImportDraft>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/${draftId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error updating import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to update import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const extractFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  draftId: number
): Promise<
  RequestResponse<{
    draft: import("./types").FlockRecordImportDraft;
    ai_available: boolean;
    warnings: string[];
  }>
> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/${draftId}/extract`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error extracting import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: [error.response?.data?.message || "Failed to extract import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const confirmFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  draftId: number
): Promise<
  RequestResponse<{
    draft: import("./types").FlockRecordImportDraft;
    summary: import("./types").FlockRecordImportConfirmSummary;
  }>
> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/${draftId}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error confirming import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: [error.response?.data?.message || "Failed to confirm import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const deleteFlockRecordImportDraft = async (
  token: string,
  farmId: number,
  flockId: number,
  draftId: number
): Promise<RequestResponse<void>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/flocks/${flockId}/record-imports/${draftId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200 || response.status === 204) {
      return { success: true, data: undefined };
    }
    return { success: false, error: [`Error deleting import draft: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: [error.response?.data?.message || "Failed to delete import draft"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Schedule editing (medication/vaccination + feeding templates)
// ─────────────────────────────────────────────────────────────────────────────

export const updateMedVacSchedule = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  scheduleId: number,
  payload: { name?: string; description?: string }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/${scheduleType}/schedules/${scheduleId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error updating schedule: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update schedule"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const updateFeedingSchedule = async (
  token: string,
  farmId: number,
  scheduleId: number,
  payload: {
    title?: string
    description?: string
    items?: Array<{
      id?: number
      feed_type_id: number
      feeding_times: Array<{ time: string; percentage: number }>
      quantity?: number
      start_day: number
      end_day?: number | null
      open_ended?: boolean
    }>
  }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feeding/schedules/${scheduleId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error updating feeding schedule: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update feeding schedule"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const createFeedingSchedule = async (
  token: string,
  farmId: number,
  payload: {
    title: string
    description?: string
    type?: "user" | "default"
    poultry_type_id?: number | null
    farm_id?: number
    items?: Array<{
      feed_type_id: number
      feeding_times: Array<{ time: string; percentage: number }>
      quantity?: number
      start_day: number
      end_day?: number | null
      open_ended?: boolean
      feeding_day?: number
    }>
  }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feeding/schedules`,
      { ...payload, type: payload.type ?? "user", farm_id: payload.farm_id ?? farmId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Error creating feeding schedule: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feeding schedule"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const deleteFeedingSchedule = async (
  token: string,
  farmId: number,
  scheduleId: number
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/feeding/schedules/${scheduleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data ?? null };
    return { success: false, error: [`Error deleting feeding schedule: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feeding schedule"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const splitFeedingScheduleItem = async (
  token: string,
  farmId: number,
  itemId: number,
  payload: {
    day: number
    feed_type_id?: number
    quantity?: number
    feeding_times?: Array<{ time: string; percentage: number }>
  }
): Promise<RequestResponse<{ original: any; created: any }>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feeding/schedule-items/${itemId}/split`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error splitting item: ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to split feeding schedule item"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const createMedVacScheduleItem = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  payload: any
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/${scheduleType}/schedule-items`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 201 || response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error creating item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const updateMedVacScheduleItem = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  itemId: number,
  payload: any
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/${scheduleType}/schedule-items/${itemId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error updating item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const deleteMedVacScheduleItem = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  itemId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/${scheduleType}/schedule-items/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: null };
    return { success: false, error: [`Error deleting item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Treat as already deleted (idempotent delete)
        return { success: true, data: null };
      }
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const createFeedingScheduleItem = async (
  token: string,
  farmId: number,
  payload: any
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feeding/schedule-items`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 201 || response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error creating feeding item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feeding item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const updateFeedingScheduleItem = async (
  token: string,
  farmId: number,
  itemId: number,
  payload: any
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feeding/schedule-items/${itemId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: response.data.data };
    return { success: false, error: [`Error updating feeding item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update feeding item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export const deleteFeedingScheduleItem = async (
  token: string,
  farmId: number,
  itemId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/feeding/schedule-items/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) return { success: true, data: null };
    return { success: false, error: [`Error deleting feeding item: ${response.status}`] };
  } catch (error: unknown) {
    console.log(error);
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Treat as already deleted (idempotent delete)
        return { success: true, data: null };
      }
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feeding item"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
};

export async function createFeedProduct(
  token: string,
  farmId: number,
  payload: Partial<PoultryFeedProduct>
): Promise<RequestResponse<PoultryFeedProduct>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/feed-products`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 201 || response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feed product"],
      };
    }
    return { success: false, error: ["Failed to create feed product"] };
  }
}

export async function updateFeedProduct(
  token: string,
  farmId: number,
  productId: number,
  payload: Partial<PoultryFeedProduct>
): Promise<RequestResponse<PoultryFeedProduct>> {
  try {
    const response = await axios.put(`/api/farms/${farmId}/feed-products/${productId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update feed product"],
      };
    }
    return { success: false, error: ["Failed to update feed product"] };
  }
}

export async function deleteFeedProduct(
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<null>> {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/feed-products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed product"],
      };
    }
    return { success: false, error: ["Failed to delete feed product"] };
  }
}

// Feed Components
export async function getFeedComponents(
  token: string,
  farmId: number,
  params?: { search?: string; status?: "active" | "inactive" | "all" }
): Promise<RequestResponse<FeedComponent[]>> {
  try {
    let url = `/api/farms/${farmId}/feed-components`;
    const q: string[] = [];
    if (params?.search) q.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.status && params.status !== "all") q.push(`status=${params.status}`);
    if (q.length) url += `?${q.join("&")}`;

    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200) {
      return { success: true, data: response.data.data || [] };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed components"] };
    }
    return { success: false, error: ["Failed to fetch feed components"] };
  }
}

export async function createFeedComponent(
  token: string,
  farmId: number,
  payload: Partial<FeedComponent>
): Promise<RequestResponse<FeedComponent>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/feed-components`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 201 || response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feed component"] };
    }
    return { success: false, error: ["Failed to create feed component"] };
  }
}

export async function generateFeedComponentWithAI(
  token: string,
  farmId: number,
  componentName: string
): Promise<RequestResponse<FeedComponent>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-components/generate-ai`,
      { name: componentName },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 201 || response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to generate feed component with AI"],
      };
    }
    return { success: false, error: ["Failed to generate feed component with AI"] };
  }
}

export async function updateFeedComponent(
  token: string,
  farmId: number,
  componentId: number,
  payload: Partial<FeedComponent>
): Promise<RequestResponse<FeedComponent>> {
  try {
    const response = await axios.put(`/api/farms/${farmId}/feed-components/${componentId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update feed component"] };
    }
    return { success: false, error: ["Failed to update feed component"] };
  }
}

export async function deleteFeedComponent(
  token: string,
  farmId: number,
  componentId: number
): Promise<RequestResponse<null>> {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/feed-components/${componentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed component"] };
    }
    return { success: false, error: ["Failed to delete feed component"] };
  }
}

// Feed Compositions
export async function getFeedCompositions(
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<FeedComposition[]>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/feed-products/${productId}/compositions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: response.data.data || [] };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feed compositions"] };
    }
    return { success: false, error: ["Failed to fetch feed compositions"] };
  }
}

export async function createFeedComposition(
  token: string,
  farmId: number,
  productId: number,
  payload: { feed_component_id: number; percentage: number }
): Promise<RequestResponse<FeedComposition>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/feed-products/${productId}/compositions`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 201 || response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feed composition"] };
    }
    return { success: false, error: ["Failed to create feed composition"] };
  }
}

export async function updateFeedComposition(
  token: string,
  farmId: number,
  productId: number,
  compositionId: number,
  payload: { percentage: number }
): Promise<RequestResponse<FeedComposition>> {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feed-products/${productId}/compositions/${compositionId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update feed composition"] };
    }
    return { success: false, error: ["Failed to update feed composition"] };
  }
}

export async function deleteFeedComposition(
  token: string,
  farmId: number,
  productId: number,
  compositionId: number
): Promise<RequestResponse<null>> {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/feed-products/${productId}/compositions/${compositionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { success: true, data: null };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed composition"] };
    }
    return { success: false, error: ["Failed to delete feed composition"] };
  }
}

export async function calculateFeedNutrition(
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<{ nutrients: Record<string, number>; product: PoultryFeedProduct }>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-products/${productId}/compositions/calculate-nutrition`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to calculate feed nutrition"] };
    }
    return { success: false, error: ["Failed to calculate feed nutrition"] };
  }
}

export async function analyzeFeedFormula(
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<{ nutritional_profile: Record<string, number>; ai_analysis?: string | null; ai_available?: boolean }>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-products/${productId}/analyze-formula`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to analyze feed formula"],
      };
    }
    return { success: false, error: ["Failed to analyze feed formula"] };
  }
}

export async function recommendFeedFormula(
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<{ nutritional_profile: Record<string, number>; ai_available: boolean; ai?: any }>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-products/${productId}/recommend-formula`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to get feed formula recommendation"],
      };
    }
    return { success: false, error: ["Failed to get feed formula recommendation"] };
  }
}

export type FormulationPayload = {
  feed_type_name: string;
  description?: string;
  target_profile?: {
    crude_protein?: number;
    crude_fat?: number;
    crude_fiber?: number;
    calcium?: number;
    phosphorus?: number;
    metabolizable_energy?: number;
    moisture?: number;
    ash?: number;
  };
  component_ids?: number[];
};

export type FormulationResult = {
  ai_available: boolean;
  ai?: {
    analysis: string;
    formula: string;
  };
};

export type FormulationChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type FormulationRevisePayload = FormulationPayload & {
  current_formula_text: string;
  message: string;
  messages?: FormulationChatMessage[];
};

export async function formulateFeed(
  token: string,
  farmId: number,
  payload: FormulationPayload
): Promise<RequestResponse<FormulationResult>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/formulate-feed`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to formulate feed"],
      };
    }
    return { success: false, error: ["Failed to formulate feed"] };
  }
}

export async function reviseFormulatedFeed(
  token: string,
  farmId: number,
  payload: FormulationRevisePayload
): Promise<RequestResponse<FormulationResult>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/formulate-feed/revise`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: [`Unexpected status ${response.status}`] };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to revise formulated feed"],
      };
    }
    return { success: false, error: ["Failed to revise formulated feed"] };
  }
}

// Restore poultry data endpoints (used by loaders)
export const getPoultryMedicationData = async (
  token: string,
  farmId: number
): Promise<RequestResponse<MedicationData>> => {
  try { 
    const response = await axios.get(
      `/api/farms/${farmId}/medications/data`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: [`Error fetching poultry medication data: ${response.status}`]
      }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch poultry medication data"]
      }
    }
    return {
      success: false,
      error: ["An unexpected error occurred"]
    }
  }
}

export const getPoultryVaccineData = async (
  token: string,
  farmId: number
): Promise<RequestResponse<VaccineData>> => {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/vaccines/data`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: [`Error fetching poultry vaccine data: ${response.status}`]
      }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch poultry vaccine data"]
      }
    } else {
      return {
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }
}

export const createVaccineProduct = async (
  token: string,
  farmId: number,
  productData: {
    poultry_vaccine_id: number
    name: string
    manufacturer: string
    administration_method_id: number
    withdrawal_period?: number
    withdrawal_period_unit?: "days" | "hours"
    dosage?: number
    dosage_unit?: string
    image_url?: string
    min_stock_level?: number
    type?: "default" | "user"
  }
): Promise<RequestResponse<VaccineProduct>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/vaccine-products`,
      // Default to user-defined products if not explicitly provided
      { type: "user", ...productData },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: response.data.data,
      }
    } else {
      return {
        success: false,
        error: [`Error creating vaccine product: ${response.status}`],
      }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create vaccine product"],
      }
    } else {
      return {
        success: false,
        error: ["An unexpected error occurred"],
      }
    }
  }
}

export const updateVaccineProduct = async (
  token: string,
  farmId: number,
  productId: number,
  productData: Partial<{
    poultry_vaccine_id: number
    name: string
    manufacturer: string
    administration_method_id: number
    withdrawal_period: number
    withdrawal_period_unit: "days" | "hours"
    dosage: number
    dosage_unit: string
    image_url: string
    min_stock_level: number
  }>
): Promise<RequestResponse<VaccineProduct>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/vaccine-products/${productId}`,
      productData,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: [`Error updating vaccine product: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update vaccine product"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const deleteVaccineProduct = async (
  token: string,
  farmId: number,
  productId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/vaccine-products/${productId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return { success: true, data: null }
    }
    return { success: false, error: [`Error deleting vaccine product: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete vaccine product"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const createVaccine = async (
  token: string,
  farmId: number,
  data: {
    name: string
    description: string
    administration_age: number
    type?: "default" | "user"
  }
): Promise<RequestResponse<vaccine>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/vaccines`,
      { type: "user", ...data },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: [`Error creating vaccine: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create vaccine"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Create a medication product
export const createMedicationProduct = async (
  token: string,
  farmId: number,
  productData: {
    poultry_medication_id: number
    name: string
    manufacturer: string
    administration_method_id: number
    withdrawal_period?: number
    withdrawal_period_unit?: "days" | "hours"
    dosage?: number
    dosage_unit?: string
    image_url?: string
    min_stock_level?: number
    type?: "default" | "user"
  }
): Promise<RequestResponse<MedicationProduct>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/medication-products`,
      { type: "user", ...productData },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, error: [`Error creating medication product: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create medication product"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Create a medication (category)
export const createMedication = async (
  token: string,
  farmId: number,
  data: {
    name: string
    description?: string
    type?: "default" | "user"
  }
): Promise<RequestResponse<Medication>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/medications`,
      // default to user type when not provided
      { type: "user", ...data },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: sanitizeMedication(response.data.data) as Medication }
    }
    return { success: false, error: [`Error creating medication: ${response.status}`] }
  } catch (error: unknown) {
    console.error("Error creating medication:", error)
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create medication"] }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Get administration methods (global)
export const getAdministrationMethods = async (
  token: string,
  farmId: number
): Promise<RequestResponse<AdministrationMethod[]>> => {
  try {
    const response = await axios.get(
      `/api/administration-methods?farm_id=${farmId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, error: [`Error fetching administration methods: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch administration methods"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Overloads for getVaccineProducts
export function getVaccineProducts(
  token: string,
  farmId: number,
  paginated: true,
  poultryVaccineId?: number,
  page?: number,
  perPage?: number
): Promise<PaginatedRequestType<VaccineProduct>>
export function getVaccineProducts(
  token: string,
  farmId: number,
  paginated?: false,
  poultryVaccineId?: number
): Promise<RequestResponse<VaccineProduct[]>>
export async function getVaccineProducts(
  token: string,
  farmId: number,
  paginated: boolean = false,
  poultryVaccineId: number = -1,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<VaccineProduct> | RequestResponse<VaccineProduct[]>> {
  try {
    let url = `/api/farms/${farmId}/vaccine-products`;
    if (paginated) {
      url += `?paginated=true&page=${page}&per_page=${perPage}`;
    }
    else {
      url += `?paginated=false`;
    }

    if (poultryVaccineId !== undefined && poultryVaccineId !== -1) {
      url += `&poultry_vaccine_id=${poultryVaccineId}`;
    }
    
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    
    if (response.status === 200) {
      if (paginated) {
        console.log('Fetched vaccine products successfully112:', response.data.data);
        return {
          success: true,
          data: response.data.data?.data || response.data.data || [],
          current_page: response.data.data?.current_page || page,
          total_pages: response.data.data?.last_page || 1,
          per_page: response.data.data?.per_page || perPage,
        } as PaginatedRequestType<VaccineProduct>;
      } else {
        console.log('Fetched vaccine products successfully:', response.data.data);
        return {
          success: true,
          data: response.data.data || []
        } as RequestResponse<VaccineProduct[]>;
      }
    } else {
      return { success: false, error: [`Error fetching vaccine products: ${response.status}`] };
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch vaccine products"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
}

// Overloads for getMedicationProducts
export function getMedicationProducts(
  token: string,
  farmId: number,
  paginated: true,
  poultryMedicationId?: number,
  page?: number,
  perPage?: number
): Promise<PaginatedRequestType<MedicationProduct>>
export function getMedicationProducts(
  token: string,
  farmId: number,
  paginated?: false,
  poultryMedicationId?: number
): Promise<RequestResponse<MedicationProduct[]>>
export async function getMedicationProducts(
  token: string,
  farmId: number,
  paginated: boolean = false,
  poultryMedicationId: number = -1,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<MedicationProduct> | RequestResponse<MedicationProduct[]>> {
  try {
    let url = `/api/farms/${farmId}/medication-products`;
    if (paginated) {
      url += `?paginated=true&page=${page}&per_page=${perPage}`;
    } else {
      url += `?paginated=false`;
    }
    if (poultryMedicationId !== undefined && poultryMedicationId !== -1) {
      url += `&poultry_medication_id=${poultryMedicationId}`;
    }
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    
    if (response.status === 200) {
      if (paginated) {
        return {
          success: true,
          data: response.data.data?.data || response.data.data || [],
          current_page: response.data.data?.current_page || page,
          total_pages: response.data.data?.last_page || 1,
          per_page: response.data.data?.per_page || perPage,
        } as PaginatedRequestType<MedicationProduct>;
      } else {
        return {
          success: true,
          data: response.data.data || []
        } as RequestResponse<MedicationProduct[]>;
      }
    } else {
      return { success: false, error: [`Error fetching medication products: ${response.status}`] };
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch medication products"],
      };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
}

// Create a vaccination record
export const createVaccinationRecord = async (
  token: string,
  farmId: number,
  recordData: {
    farm_id: number
    flock_id: number
    poultry_vaccine_id: number
    poultry_vaccine_inventory_id: number
    date: string
    administered_by: number | string
    dosage: number
    dosage_unit: string
    quantity: number
    cost: number
    notes: string | number
    administration_method_id: number
  }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/vaccination-records`,
      recordData,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, error: [`Error creating vaccination record: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create vaccination record"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Delete a vaccination record
export const deleteVaccinationRecord = async (
  token: string,
  farmId: number,
  recordId: number
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/vaccination-records/${recordId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, error: [`Error deleting vaccination record: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete vaccination record"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Overloads for getVaccines
export function getVaccines(
  token: string,
  farmId: number,
  paginated: true,
  page?: number,
  perPage?: number
): Promise<PaginatedRequestType<vaccine>>
export function getVaccines(
  token: string,
  farmId: number,
  paginated?: false
): Promise<RequestResponse<vaccine[]>>
export async function getVaccines(
  token: string,
  farmId: number,
  paginated: boolean = false,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<vaccine> | RequestResponse<vaccine[]>> {
  try {
    let url = `/api/farms/${farmId}/vaccines`;
    if (paginated) {
      url += `/${true}?page=${page}&perPage=${perPage}`;
    }
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200) {
      if (paginated) {
        return {
          success: true,
          data: response.data.data.data || [],
          current_page: response.data.data.current_page,
          total_pages: response.data.data.last_page,
          per_page: response.data.data.per_page
        } as PaginatedRequestType<vaccine>;
      } else {
        return { success: true, data: response.data.data || [] } as RequestResponse<vaccine[]>;
      }
    } else {
      return { success: false, error: [`Error fetching vaccines: ${response.status}`] };
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch vaccines"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
}

// Overloads for getVaccineInventories
export function getVaccineInventories(
  token: string,
  farmId: number,
  paginated: true,
  page?: number,
  perPage?: number
): Promise<PaginatedRequestType<PoultryVaccineInventory>>
export function getVaccineInventories(
  token: string,
  farmId: number,
  paginated?: false
): Promise<RequestResponse<PoultryVaccineInventory[]>>
export async function getVaccineInventories(
  token: string,
  farmId: number,
  paginated: boolean = false,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<PoultryVaccineInventory> | RequestResponse<PoultryVaccineInventory[]>> {
  try {
    let url = `/api/farms/${farmId}/vaccine-inventory`;
    if (paginated) {
      url += `/${true}?page=${page}&perPage=${perPage}`;
    }
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200) {
      if (paginated) {
        return {
          success: true,
          data: response.data.data.data || [],
          current_page: response.data.data.current_page,
          total_pages: response.data.data.last_page,
          per_page: response.data.data.per_page
        } as PaginatedRequestType<PoultryVaccineInventory>;
      } else {
        return { success: true, data: response.data.data || [] } as RequestResponse<PoultryVaccineInventory[]>;
      }
    } else {
      return { success: false, error: [`Error fetching vaccine inventories: ${response.status}`] };
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch vaccine inventories"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
}

export async function getFeedinVentories(token: string,
  farmId: number) : Promise<RequestResponse<FeedInventoryType[]>> {

    try {
      let url = `/api/farms/${farmId}/feed-inventories`;
     
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200) {

          const sanitizedData = Array.isArray(response.data?.data)
            ? response.data.data.map(sanitizeFeedInventory).filter(Boolean)
            : [];
          console.log('Fetched Feed inventories successfully:', response.data.data );
          console.log('Fetched Feed sanitized inventories successfully:', sanitizedData);

          return { success: true, data: sanitizedData as unknown as FeedInventoryType[] } as RequestResponse<FeedInventoryType[]>;
        
      } else {
        return { success: false, error: [`Error fetching Feed inventories: ${response.status}`] };
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch Feed inventories"] };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }

  }

  export async function getMedicationInventories(token: string, farmId: number) : Promise<RequestResponse<MedicationInventory[]>> { 

    try {
      let url = `/api/farms/${farmId}/medication-inventory`;
     
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200) {

          const sanitizedData = Array.isArray(response.data?.data)
            ? response.data.data.map(sanitizeMedicationInventory).filter(Boolean)
            : [];                                                                                   
          console.log('Fetched Medication inventories successfully:', response.data.data );
          console.log('Fetched Medication sanitized inventories successfully:', sanitizedData);
          return { success: true, data: sanitizedData as unknown as MedicationInventory[] } as RequestResponse<MedicationInventory[]> ;

      } else {
        return { success: false, error: [`Error fetching Medication inventories: ${response.status}`] };
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch Medication inventories"] };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
    
  }
export async function getVaccineInventoriesList(token: string, farmId: number) : Promise<RequestResponse<VaccineInventory[]>> {
  
    try {
      let url = `/api/farms/${farmId}/vaccine-inventory`;

      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200) {
        
          const sanitizedData = Array.isArray(response.data?.data)


            ? response.data.data.map(sanitizeVaccineInventory).filter(Boolean)
            : [];
          console.log('Fetched Vaccine inventories successfully:', response.data.data );
          console.log('Fetched Vaccine sanitized inventories successfully:', sanitizedData);
          return { success: true, data: sanitizedData as unknown as VaccineInventory[] } as RequestResponse<VaccineInventory[]> ;

      } else {
        return { success: false, error: [`Error fetching Vaccine inventories: ${response.status}`] };
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch Vaccine inventories"] };
      }
      return { success: false, error: ["An unexpected error occurred"] };
    }
    
  }

// Create a vaccine inventory item
export const createVaccineInventory = async (
  token: string,
  farmId: number,
  data: {
    poultry_vaccine_product_id: number
    quantity: number
    batch_number?: string
    manufacture_date?: string | null
    expiry_date?: string | null
    unit_cost?: number
    notes?: string
  }
): Promise<RequestResponse<VaccineInventory>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/vaccine-inventory`,
      // Default to user-defined products if not explicitly provided
      { type: "user", ...data },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: response.data.data,
      }
    } else {
      return {
        success: false,
        error: [`Error creating vaccine inventory: ${response.status}`],
      }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create vaccine inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Create a medication inventory item
export const createMedicationInventory = async (
  token: string,
  farmId: number,
  data: {
    medication_product_id: number
    quantity: number
    batch_number?: string
    manufacture_date?: string | null
    expiry_date?: string | null
    unit_cost?: number
    notes?: string
  }
): Promise<RequestResponse<MedicationInventory>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/medication-inventory`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: sanitizeMedicationInventory(response.data.data)
      }
    } else {
      return { success: false, error: [`Error creating medication inventory: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create medication inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Create a feed inventory item
export const createFeedInventory = async (
  token: string,
  farmId: number,
  data: {
    poultry_feed_type_id?: number
    quantity: number
    batch_number?: string
    manufacture_date?: string | null
    expiry_date?: string | null
    unit_cost?: number
    notes?: string
  }
): Promise<RequestResponse<FeedInventoryType>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-inventories`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: sanitizeFeedInventory(response.data.data)
      }
    } else {
      return { success: false, error: [`Error creating feed inventory: ${response.status}`] }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feed inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const updateFeedInventory = async (
  token: string,
  farmId: number,
  inventoryId: number,
  data: Partial<{
    poultry_feed_type_id: number
    quantity: number
    batch_number: string
    manufacturer: string
    manufacture_date: string | null
    expiry_date: string | null
    unit_cost: number
    notes: string
  }>
): Promise<RequestResponse<FeedInventoryType>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feed-inventories/${inventoryId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeFeedInventory(response.data.data),
      }
    }

    return { success: false, error: [`Error updating feed inventory: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to update feed inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const deleteFeedInventory = async (
  token: string,
  farmId: number,
  inventoryId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(
      `/api/farms/${farmId}/feed-inventories/${inventoryId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return { success: true, data: null }
    }

    return { success: false, error: [`Error deleting feed inventory: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const closeFeedInventory = async (
  token: string,
  farmId: number,
  inventoryId: number,
  options?: { notes?: string; flock_id?: number }
): Promise<RequestResponse<FeedInventoryType>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-inventories/${inventoryId}/close`,
      {
        notes: options?.notes,
        flock_id: options?.flock_id,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeFeedInventory(response.data.data) as FeedInventoryType,
      }
    }

    return { success: false, error: [`Error closing feed inventory: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to close feed inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const transferFeedInventory = async (
  token: string,
  farmId: number,
  targetInventoryId: number,
  data: { from_inventory_id: number; quantity: number }
): Promise<
  RequestResponse<{
    transferred_quantity: number
    target: FeedInventoryType
    source: FeedInventoryType
  }>
> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/feed-inventories/${targetInventoryId}/transfer`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return {
        success: true,
        data: {
          transferred_quantity: Number(response.data.data.transferred_quantity),
          target: sanitizeFeedInventory(response.data.data.target),
          source: sanitizeFeedInventory(response.data.data.source),
        },
      }
    }

    return { success: false, error: [`Error transferring feed inventory: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ["Failed to transfer feed inventory"],
      }
    }
    return { success: false, error: ["An unexpected error occurred"] }
  }
}

// Overloads for getMedications
export function getMedications(
  token: string,
  farmId: number,
  paginated: true,
  page?: number,
  perPage?: number
): Promise<PaginatedRequestType<Medication>>;
export function getMedications(
  token: string,
  farmId: number,
  paginated?: false
): Promise<RequestResponse<Medication[]>>;
export async function getMedications(
  token: string,
  farmId: number,
  paginated: boolean = false,
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedRequestType<Medication> | RequestResponse<Medication[]>> {
  try {
    let url = `/api/farms/${farmId}/medications`;
    if (paginated) {
      url += `/paginated?page=${page}&perPage=${perPage}`;
    }

    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200) {
      if (paginated) {
        const sanitized = (response.data.data.data || []).map(sanitizeMedication).filter(Boolean);
        return {
          success: true,
          data: sanitized,
          current_page: response.data.data.current_page,
          total_pages: response.data.data.last_page,
          per_page: response.data.data.per_page
        } as PaginatedRequestType<Medication>;
      }

      const sanitizedList = Array.isArray(response.data?.data)
        ? response.data.data.map(sanitizeMedication).filter(Boolean)
        : [];

      return { success: true, data: sanitizedList } as RequestResponse<Medication[]>;
    } else {
      return { success: false, error: [`Error fetching medications: ${response.status}`] };
    }
  } catch (error: unknown) {
    console.error("Error fetching medications:", error);
    if (isAxiosError(error)) {
      return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch medications"] };
    }
    return { success: false, error: ["An unexpected error occurred"] };
  }
}
export type GroupedPermissionsResponse = {
  groups: PermissionGroup[]
  total_permissions: number
}

export const getGroupedPermisssions = async (
    token: string,
    farmId: number
  ): Promise<RequestResponse<GroupedPermissionsResponse>> => {
    try {
      const response = await axios.get(
        `/api/permissions/group/${farmId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data
        if (Array.isArray(payload)) {
          const groups = payload as PermissionGroup[]
          const total = groups.reduce(
            (sum, group) => sum + (Array.isArray(group.permissions) ? group.permissions.length : 0),
            0
          )
          return {
            success: true,
            data: { groups, total_permissions: total },
          }
        }

        const groups = Array.isArray(payload?.groups) ? (payload.groups as PermissionGroup[]) : []
        const total =
          typeof payload?.total_permissions === "number"
            ? payload.total_permissions
            : groups.reduce(
                (sum, group) => sum + (Array.isArray(group.permissions) ? group.permissions.length : 0),
                0
              )

        return {
          success: true,
          data: { groups, total_permissions: total },
        }
      } else {
        return {
          success: false,
          error: [`Error fetching grouped permissions: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {      
          success: false, 
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch grouped permissions"]
        }
      }
      return {
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }
  export const getRolesWithPermissions = async ( 
    token: string,
    farmId: number
  ): Promise<RequestResponse<Role[]>> => {
    try {
      const response = await axios.get(
        `/api/permissions/roles/${farmId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data
        }
      }
      else {
        return {
          success: false,
          error: [`Error fetching roles with permissions: ${response.status}`]
        }
      }
    }
    catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch roles with permissions"]
        }
      }
      return {  
        success: false,
        error: ["An unexpected error occurred"]
      }
    }
  }

  export const updateRolePermissions = async (
    token: string,
    roleId: number,
    farmId: number | undefined,
    permissionIds: number[],
  ): Promise<RequestResponse<any>> => {
    try {
      console.log("here");
      const response = await axios.post(
        `/api/permissions/add-permissions-to-role`,
        { farm_id: farmId, role_id: roleId, permission_ids: permissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 204) {
        return { success: true, data: response.data ?? null }
      }
      return { success: false, error: [`Error updating role permissions: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update role permissions"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const removePermissionFromRole = async (
    token: string,
    roleId: number,
    farmId: number | undefined,
    permissionIds: number[],
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/permissions/remove-permission-from-role`,
        { farm_id: farmId, role_id: roleId, permission_ids: permissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 204) {
        return { success: true, data: response.data ?? null }
      }
      return { success: false, error: [`Error removing permissions from role: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to remove permissions from role"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  // Overloaded function signatures for getFeedingSchedules
  export function getFeedingSchedules(
    token: string,
    farmId: number,
    paginated: true,
    page?: number,
    perPage?: number
  ): Promise<PaginatedRequestType<FeedingSchedule[]>>;
  export function getFeedingSchedules(
    token: string,
    farmId: number,
    paginated?: false
  ): Promise<RequestResponse<FeedingSchedule[]>>;
  export async function getFeedingSchedules(
    token: string,
    farmId: number,
    paginated: boolean = false,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedRequestType<FeedingSchedule[]> | RequestResponse<FeedingSchedule[]>> {
    try {
      let url = `/api/farms/${farmId}/feeding/schedules`;
      if (paginated) {
        // Backend expects a `paginate` flag plus page/per_page
        url += `?paginate=true&pagination=true&page=${page}&per_page=${perPage}`;
      } else {
        // Explicitly disable pagination so the backend can't fall back to paginated behaviour
        url += `?pagination=false`;
      }
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.status === 200) {
        if (paginated) {
          const payload = response.data.data;
          return {
            success: true,
            data: payload?.data || [],
            current_page: payload?.current_page || page,
            total_records: payload?.total,
            total_pages: payload?.last_page || 1,
            per_page: payload?.per_page || perPage,
          } as PaginatedRequestType<FeedingSchedule[]>;
        } else {
          // Handle both plain array and paginated object responses
          const raw = response.data.data;
          const data = Array.isArray(raw) ? raw : (raw?.data ?? []);
          return {
            success: true,
            data
          } as RequestResponse<FeedingSchedule[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error getting Feeding Schedules Data!!! ${response.status}`],
        };
      }
    } catch (error: unknown) {
      console.log(error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || ["Axios Request failed"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  }

  export const createFeedingBatchSchedule = async (
    token: string,
    farmId: number,
    data: {
      flock_id: number
      feeding_schedule_id: number
      status?: "scheduled" | "in_progress" | "completed" | "cancelled"
    }
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/feeding/batch-schedules`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data }
      }
      return { success: false, error: [`Error assigning feeding schedule: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errs = error.response?.data?.errors
        if (errs && typeof errs === "object") {
          const flat = Object.values(errs).flat().filter(Boolean) as string[]
          if (flat.length) return { success: false, error: flat }
        }
        return {
          success: false,
          error: [error.response?.data?.message || "Failed to assign feeding schedule"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getFeedingBatchItemByDate = async (
    token: string,
    farmId: number,
    flockId: number,
    date: string
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/feeding/batch-schedules/flock/${flockId}/items-by-date`,
        { params: { date }, headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? null }
      }
      return { success: false, error: [`Error fetching feeding batch item: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error fetching feeding batch item:", error)
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch feeding batch item"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getMortalityByFlockAndDate = async (
    token: string,
    farmId: number,
    flockId: number,
    date: string
  ): Promise<RequestResponse<{ total_mortality: number; report_count: number }>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/flock-mortality-reports/by-flock-date`,
        { params: { flock_id: flockId, date }, headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return { success: true, data: response.data.data ?? null }
      }
      return { success: false, error: [`Error fetching mortality data: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error fetching mortality data:", error)
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch mortality data"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const createBatchScheduleItem = async (
    token: string,
    farmId: number,
    scheduleType: 'vaccination' | 'medication',
    data: {
      batch_schedule_id: number
      schedule_item_id: number
      scheduled_date: string
      actual_date?: string | null
      status?: 'scheduled' | 'completed' | 'missed' | 'late'
      administered_by?: string | null
      dosage?: number | null
      quantity?: number | null
      cost?: number | null
      notes?: string | null
      administration_method_id?: number | null
      poultry_vaccine_product_id?: number
      vaccine_product_batch_id?: number | null
      poultry_medication_id?: number
    }
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/${scheduleType}/batch-schedule-items`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? response.data ?? null }
      }
      return { success: false, error: [`Error creating batch schedule item: ${response.status}`] }
    } catch (error: unknown) {
      console.error('Error creating batch schedule item:', error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.errors ||
            [error.response?.data?.message] ||
            ['Failed to implement batch schedule item'],
        }
      }
      return { success: false, error: ['An unexpected error occurred'] }
    }
  }

export const updateBatchScheduleItem = async (
  token: string,
  farmId: number,
  scheduleType: 'vaccination' | 'medication',
  itemId: number,
  data: {
    batch_schedule_id?: number
    schedule_item_id?: number
    scheduled_date?: string
    actual_date?: string | null
    status?: 'scheduled' | 'completed' | 'missed' | 'late'
    administered_by?: string | null
    dosage?: number | null
    quantity?: number | null
    cost?: number | null
    notes?: string | null
    administration_method_id?: number | null
    poultry_vaccine_product_id?: number
    vaccine_product_batch_id?: number | null
    poultry_medication_id?: number
  }
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/${scheduleType}/batch-schedule-items/${itemId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return { success: true, data: response.data.data ?? response.data ?? null }
    }
    return { success: false, error: [`Error updating batch schedule item: ${response.status}`] }
  } catch (error: unknown) {
    console.error('Error updating batch schedule item:', error)
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors ||
          [error.response?.data?.message] ||
          ['Failed to update batch schedule item'],
      }
    }
    return { success: false, error: ['An unexpected error occurred'] }
  }
}

  export const createFeedingBatchItem = async (
    token: string,
    farmId: number,
    data: {
      feeding_batch_schedule_id: number
      feeding_schedule_item_id: number
      feeding_date: string
      actual_quantity?: number | null
      actual_feeding_time: Array<{ time: string; percentage: number }>
      status?: "scheduled" | "completed" | "missed" | "late"
      notes?: string | null
    }
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/feeding/batch-schedule-items`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? response.data ?? null }
      }
      return { success: false, error: [`Error creating feeding batch item: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error creating feeding batch item:", error)
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create feeding batch item"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getMissedFeedingDays = async (
    token: string,
    farmId: number,
    batchScheduleId: number,
    params?: { from_day?: number; through_day?: number }
  ): Promise<RequestResponse<import("./types").MissedFeedingDaysPreview>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/feeding/batch-schedules/${batchScheduleId}/missed-days`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      )
      if (response.status === 200) {
        return { success: true, data: response.data.data ?? response.data }
      }
      return { success: false, error: [`Error fetching missed feeding days: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error fetching missed feeding days:", error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch missed feeding days"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const implementMissedFeedingDays = async (
    token: string,
    farmId: number,
    batchScheduleId: number,
    payload?: {
      from_day?: number
      through_day?: number
      status?: "scheduled" | "completed" | "missed" | "late"
      inventory_by_feed_type?: Record<number, number>
    }
  ): Promise<RequestResponse<import("./types").ImplementMissedFeedingResult>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/feeding/batch-schedules/${batchScheduleId}/implement-missed`,
        payload ?? {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? response.data }
      }
      return { success: false, error: [`Error implementing missed feeding days: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error implementing missed feeding days:", error)
      if (isAxiosError(error)) {
        const errors = error.response?.data?.errors
        const message = error.response?.data?.message
        const flattened = flattenApiErrors(errors) || message
        return {
          success: false,
          error: flattened ? [flattened] : ["Failed to implement missed feeding days"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getRevertibleFeedingDays = async (
    token: string,
    farmId: number,
    batchScheduleId: number,
    params?: { from_day?: number; through_day?: number }
  ): Promise<RequestResponse<import("./types").RevertibleFeedingDaysPreview>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/feeding/batch-schedules/${batchScheduleId}/revertible-days`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      )
      if (response.status === 200) {
        return { success: true, data: response.data.data ?? response.data }
      }
      return { success: false, error: [`Error fetching revertible feeding days: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error fetching revertible feeding days:", error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch revertible feeding days"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const revertMissedFeedingDays = async (
    token: string,
    farmId: number,
    batchScheduleId: number,
    payload?: { from_day?: number; through_day?: number }
  ): Promise<RequestResponse<import("./types").RevertMissedFeedingResult>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/feeding/batch-schedules/${batchScheduleId}/revert-missed`,
        payload ?? {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return { success: true, data: response.data.data ?? response.data }
      }
      return { success: false, error: [`Error reverting missed feeding days: ${response.status}`] }
    } catch (error: unknown) {
      console.error("Error reverting missed feeding days:", error)
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to revert missed feeding days"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const createRole = async (
    token: string,
    roleName: string,
    farmId: number | undefined,
    permissionIds: number[],
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/permissions/roles`,
        { farm_id: farmId, name: roleName, permissions: permissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data ?? null }
      }
      return { success: false, error: [`Error creating role: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return { success: false, error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create role"] }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getFarmUsers = async (
    token: string,
    farmId: number
  ): Promise<RequestResponse<FarmUserRoleSummary[]>> => {
    try {
      const response = await axios.get(
        `/api/farms/${farmId}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data ?? []
        }
      }
      return { success: false, error: [`Error fetching farm users: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch farm users"]
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const inviteUserToFarm = async (
    token: string,
    farmId: number,
    payload: { email: string; role: "owner" | "manager" | "worker" }
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/users/invite`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? null }
      }
      return { success: false, error: [`Error inviting user to farm: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.errors ||
            [error.response?.data?.message] ||
            ["Failed to invite user to farm"],
          code: error.response?.data?.code,
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const resendFarmUserInvite = async (
    token: string,
    farmId: number,
    invitationId: number
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/users/invitations/${invitationId}/resend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? null }
      }
      return { success: false, error: [`Error resending invitation: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.errors ||
            [error.response?.data?.message] ||
            ["Failed to resend invitation"],
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

export const updatePassword = async (
  token: string,
  payload: {
    current_password: string
    password: string
    password_confirmation: string
  }
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.post("/api/update-password", payload, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: null }
    }

    return { success: false, error: [`Error updating password: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update password"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const updateUserProfile = async (
  token: string,
  payload: {
    name?: string
    email?: string
    phone?: string
    profile_photo?: File | null
  }
): Promise<RequestResponse<User>> => {
  try {
    const formData = new FormData()
    if (payload.name !== undefined) formData.append("name", payload.name)
    if (payload.email !== undefined) formData.append("email", payload.email)
    if (payload.phone !== undefined) formData.append("phone", payload.phone)
    if (payload.profile_photo) formData.append("profile_photo", payload.profile_photo)

    const response = await axios.post("/api/user/profile", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error updating profile: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update profile"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getUserPreferences = async (token: string): Promise<RequestResponse<UserSettings>> => {
  try {
    const response = await axios.get("/api/user/preferences", {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error loading user preferences: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load user preferences"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const updateUserPreferences = async (
  token: string,
  payload: Partial<Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<RequestResponse<UserSettings>> => {
  try {
    const response = await axios.put("/api/user/preferences", payload, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error updating user preferences: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update user preferences"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const logoutOtherDevices = async (token: string): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.post(
      "/api/user/logout-other-devices",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return { success: true, data: null }
    }

    return { success: false, error: [`Error signing out other devices: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error:
          error.response?.data?.errors || [error.response?.data?.message] || ["Failed to sign out other devices"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export type UpdateFarmPayload = Partial<{
  name: string
  address: string
  city: string
  state: string
  country_id: number
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  registration_number: string | null
  tax_id: string | null
  size_hectares: number | string | null
  established_date: string | null
  status: string
  logo: File | null
}>

export const updateFarm = async (
  token: string,
  farmId: number,
  payload: UpdateFarmPayload
): Promise<RequestResponse<Farm>> => {
  try {
    const hasFile = payload.logo instanceof File

    const response = hasFile
      ? await axios.post(`/api/farms/${farmId}?_method=PUT`, (() => {
          const formData = new FormData()
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, value instanceof File ? value : String(value))
            }
          })
          return formData
        })(), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      : await axios.put(`/api/farms/${farmId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error updating farm: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update farm"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getSubscriptionPlans = async (token: string): Promise<RequestResponse<SubscriptionPlan[]>> => {
  try {
    const response = await axios.get(`/api/subscription/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data || [] }
    }

    return { success: false, error: [`Error loading plans: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load plans"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getFarmSubscription = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmSubscriptionSummary>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error loading subscription: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load subscription"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getSubscriptionTransactions = async (
  token: string,
  farmId: number
): Promise<RequestResponse<SubscriptionTransaction[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/subscription/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data?.data || [] }
    }

    return { success: false, error: [`Error loading payment history: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load payment history"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const startSubscriptionCheckout = async (
  token: string,
  farmId: number,
  planSlug: string
): Promise<RequestResponse<PaystackCheckout>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/subscription/checkout`,
      { plan_slug: planSlug },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error starting checkout: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to start checkout"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const changeSubscriptionPlan = async (
  token: string,
  farmId: number,
  planSlug: string
): Promise<RequestResponse<FarmSubscriptionSummary>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/subscription/change-plan`,
      { plan_slug: planSlug },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error changing plan: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to change plan"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const cancelSubscription = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmSubscriptionSummary>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/subscription/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error cancelling subscription: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to cancel subscription"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getFarmSettings = async (token: string, farmId: number): Promise<RequestResponse<FarmSettings>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error loading farm settings: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load farm settings"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const updateFarmSettings = async (
  token: string,
  farmId: number,
  payload: Partial<Omit<FarmSettings, "id" | "farm_id" | "created_at" | "updated_at">>
): Promise<RequestResponse<FarmSettings>> => {
  try {
    const response = await axios.put(`/api/farms/${farmId}/settings`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: [`Error updating farm settings: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update farm settings"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getFeedAgeRanges = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FeedType[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/feed-age-ranges`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      return { success: true, data: response.data.data || [] }
    }

    return { success: false, error: [`Error loading feed age ranges: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load feed age ranges"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const updateFeedAgeRanges = async (
  token: string,
  farmId: number,
  ranges: Array<{ poultry_feed_type_id: number; start_age: number; end_age: number | null }>
): Promise<RequestResponse<FeedType[]>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/feed-age-ranges`,
      { ranges },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.status === 200) {
      return { success: true, data: response.data.data || [] }
    }

    return { success: false, error: [`Error updating feed age ranges: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const errors = error.response?.data?.errors
      const message = error.response?.data?.message
      return {
        success: false,
        error: Array.isArray(errors)
          ? errors
          : errors
            ? Object.values(errors).flat() as string[]
            : [message || "Failed to update feed age ranges"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

export const getMyPermissions = async (
  token: string,
  farmId: number
): Promise<RequestResponse<string[]>> => {
  try {
    const response = await axios.get(`/api/permissions/mypermissions/${farmId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 200) {
      const payload = response.data?.data ?? response.data
      let names: string[] = []

      if (Array.isArray(payload)) {
        names = payload.map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "name" in item) {
            return String((item as { name: string }).name)
          }
          return ""
        }).filter(Boolean)
      } else if (payload && typeof payload === "object" && Array.isArray((payload as { permissions?: unknown }).permissions)) {
        names = ((payload as { permissions: unknown[] }).permissions).map((item) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "name" in item) {
            return String((item as { name: string }).name)
          }
          return ""
        }).filter(Boolean)
      }

      return { success: true, data: names }
    }

    return { success: false, error: [`Error loading permissions: ${response.status}`] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to load permissions"],
      }
    }

    return { success: false, error: ["An unexpected error occurred"] }
  }
}

  export const addUserToFarm = async (
    token: string,
    farmId: number,
    payload: { email: string; role: "owner" | "manager" | "worker" }
  ): Promise<RequestResponse<null>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/users`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: null }
      }
      return { success: false, error: [`Error adding user to farm: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to add user to farm"],
          code: error.response?.data?.code,
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const syncUserRoles = async (
    token: string,
    farmId: number,
    userId: number,
    roleIds: number[]
  ): Promise<RequestResponse<any>> => {
    try {
      const response = await axios.post(
        `/api/permissions/sync-roles`,
        { farm_id: farmId, user_id: userId, role_ids: roleIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data.data ?? null }
      }
      return { success: false, error: [`Error syncing user roles: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to sync user roles"]
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }

  export const getUserPermissions = async (
    token: string,
    farmId: number,
    userId: number
  ): Promise<RequestResponse<{ user: any; permissions: string[] }>> => {
    try {
      const response = await axios.get(
        `/api/permissions/farm/${farmId}/user/${userId}/permissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        return {
          success: true,
          data: response.data.data ?? null
        }
      }
      return { success: false, error: [`Error fetching user permissions: ${response.status}`] }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch user permissions"]
        }
      }
      return { success: false, error: ["An unexpected error occurred"] }
    }
  }