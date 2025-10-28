import axios from "./axios"
import type {    LoginData,  PaginatedRequestType,  RequestResponse } from "./interfaces"
import type { AuthResponse, DetailedFlockRecord, DetailedSchedule, Farm, FarmStatsDataType, FlockRecord, PoultryDashboardData, WeatherDataType, PoultryType, PoultryHouse, FlockStage, WeightReport, MortalityReport, PoultryFeedUsageRecord, FeedInventoryType, FeedType, Medication, VaccineProduct, MedicationData, VaccineData, MedicationProduct, AdministrationMethod, vaccine, PoultryVaccineInventory } from "./types"
import  { isAxiosError } from "axios"


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
 export  const  StoreToken = (token : string) => {
    localStorage.setItem('authToken', token);
  }
  
  export const GetToken = () : string | null => {
    return localStorage.getItem('authToken');
  }

  export const StoreFarm = (farm : Farm) => {
  localStorage.setItem('activeFarm', JSON.stringify(farm));
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
    unit_cost: toNumber(inv.unit_cost),
    created_by: inv.created_by !== undefined && inv.created_by !== null ? toNumber(inv.created_by) : inv.created_by,
    poultry_feed_type: inv.poultry_feed_type ? {
      ...inv.poultry_feed_type,
      id: toNumber(inv.poultry_feed_type.id),
      poultry_type_id: toNumber(inv.poultry_feed_type.poultry_type_id),
      start_age: inv.poultry_feed_type.start_age !== null && inv.poultry_feed_type.start_age !== undefined ? toNumber(inv.poultry_feed_type.start_age) : null,
      end_age: inv.poultry_feed_type.end_age !== null && inv.poultry_feed_type.end_age !== undefined ? toNumber(inv.poultry_feed_type.end_age) : null,
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
  } : undefined;
  
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
      daily_records: sanitizeArray(record.daily_records, (r: any) => ({
        ...r,
        id: toNumber(r.id),
        farm_id: toNumber(r.farm_id),
        flock_id: toNumber(r.flock_id),
        mortality: toNumber(r.mortality),
        culls: toNumber(r.culls),
        feed_consumed_kg: toNumber(r.feed_consumed_kg),
        water_consumed_liters: toNumber(r.water_consumed_liters),
        avg_weight_grams: toNumber(r.avg_weight_grams),
        min_temperature: toNumber(r.min_temperature),
        max_temperature: toNumber(r.max_temperature),
        humidity: toNumber(r.humidity),
        light_hours: toNumber(r.light_hours),
        eggs_collected: toNumber(r.eggs_collected),
        eggs_broken: toNumber(r.eggs_broken),
        recorded_by: toNumber(r.recorded_by)
      })),
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
      weight_reports: sanitizeArray(record.weight_reports, (r: any) => ({
        ...r,
        id: toNumber(r.id),
        farm_id: toNumber(r.farm_id),
        flock_id: toNumber(r.flock_id),
        average_weight: toNumber(r.average_weight),
        min_weight: toNumber(r.min_weight),
        max_weight: toNumber(r.max_weight),
        number_of_birds: toNumber(r.number_of_birds),
        sample_size: toNumber(r.sample_size),
        recorded_by: toNumber(r.recorded_by)
      })),
      egg_reports: sanitizeArray(record.egg_reports, (r: any) => ({
        ...r,
        id: toNumber(r.id),
        farm_id: toNumber(r.farm_id),
        flock_id: toNumber(r.flock_id),
        eggs_collected: toNumber(r.eggs_collected),
        average_egg_weight: toNumber(r.average_egg_weight),
        production_percentage: toNumber(r.production_percentage),
        bird_count: toNumber(r.bird_count),
        recorded_by: toNumber(r.recorded_by)
      })),
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
        url += `/paginated?page=${page}&perPage=${perPage}`;
      }
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.status === 200) {
        if (paginated) {
          return {
            success: true,
            data: response.data.data.data,
            current_page: response.data.data.current_page,
            total_pages: response.data.data.total,
            per_page: response.data.data.per_page,
          } as PaginatedRequestType<DetailedSchedule[]>;
        } else {
          return {
            success: true,
            data: response.data.data || []
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
      batch_number: string
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
    }
  ): Promise<RequestResponse<FlockRecord>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/flocks`,
        flockData,
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
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create flock"]
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        }
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

  export const createDailyRecord = async (
    token: string,
    farmId: number,
    flockId: number,
    recordData: {
      date: string
      mortality: number
      culls: number
      feed_consumed_kg: number
      water_consumed_liters: number
      avg_weight_grams: number
      min_temperature: number
      max_temperature: number
      humidity: number
      light_hours: number
      eggs_collected: number
      eggs_broken: number
      notes: string
    }
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
          data: response.data.data
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

  export const createMortalityRecord = async (
    token: string,
    recordData: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<RequestResponse<MortalityReport>> => {
    try {
      const response = await axios.post(
        '/api/mortality-records',
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
          data: response.data.data
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

  export const createFeedUsageRecord = async (
    token: string,
    farmId: number,
    recordData: Omit<PoultryFeedUsageRecord, 'id' | 'created_at' | 'updated_at' | 'feed_inventory' | 'feed_type' | 'flock'>
  ): Promise<RequestResponse<PoultryFeedUsageRecord>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/feed-usages`,
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

  export const deleteFeedUsageRecord = async (
    token: string,
    farmId: number,
    recordId: number
  ): Promise<RequestResponse<void>> => {
    try {
      const response = await axios.delete(
        `/api/farms/${farmId}/feed-usages/${recordId}`,
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
          error: [`Error deleting feed usage record! Status: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      console.error("Error deleting feed usage record:", error);
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to delete feed usage record"],
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        };
      }
    }
  };

  // Overloaded function signatures for getMedications
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
          const sanitizedData = response.data.data.data?.map(sanitizeMedication) || [];
          return {
            success: true,
            data: sanitizedData,
            current_page: response.data.data.current_page,
            total_pages: response.data.data.last_page,
            per_page: response.data.data.per_page
          } as PaginatedRequestType<Medication>;
        } else {
          const sanitizedData = response.data.data?.map(sanitizeMedication) || [];
          return {
            success: true,
            data: sanitizedData
          } as RequestResponse<Medication[]>;
        }
      } else {
        return {
          success: false,
          error: [`Error fetching medications: ${response.status}`]
        };
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to fetch medications"]
        };
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"]
        };
      }
    }
  }

  // Create a medication category (not a product)
  export const createMedication = async (
    token: string,
    farmId: number,
    data: { name: string; description?: string }
  ): Promise<RequestResponse<Medication>> => {
    try {
      const response = await axios.post(
        `/api/farms/${farmId}/medications`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: sanitizeMedication(response.data.data)
        }
      } else {
        return {
          success: false,
          error: [`Error creating medication: ${response.status}`]
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to create medication"],
        }
      } else {
        return {
          success: false,
          error: ["An unexpected error occurred"],
        }
      }
    }
  }

  // Update a medication category (not a product)
export const updateMedication = async (
  token: string,
  farmId: number,
  medicationId: number,
  data: { name?: string; description?: string }
): Promise<RequestResponse<Medication>> => {
  try {
    const response = await axios.put(
      `/api/farms/${farmId}/medications/${medicationId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.status === 200) {
      return {
        success: true,
        data: sanitizeMedication(response.data.data)
      }
    } else {
      return {
        success: false,
        error: [`Error updating medication: ${response.status}`]
      }
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message] || ["Failed to update medication"],
      }
    } else {
      return {
        success: false,
        error: ["An unexpected error occurred"],
      }
    }
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