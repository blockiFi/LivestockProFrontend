import type { DetailedFlockRecord, Farm, FarmStatsDataType, FlockDetail, FlockRecord, PoultryDashboardData, User } from "./types";

export interface LoginResponse {
    success : boolean,
      token : string,
     data : User
    
  }

  export interface ErrorResponse {
    success: boolean;
    error: string[]; // array of error messages
  }

  export interface AuthState {
    user : User | null ,
    token : string,
    activeFarm : Farm | null,
    authenticated : boolean
}
 

  export interface LoginData { 
    email : string,
    password : string
  }

export interface FarmRequestData {
  success : boolean,
  data? : Farm[],
  error? : string[]

}
export interface NewScheduleItem {
  name: string
  age_days: number
  dose?: number
  dose_unit?: string
  withdrawal_period_days?: number
  storage_instructions?: string
  description: string
  quantity?: string
  // Medication specific
  medication_id?: number
  // Vaccination specific
  vaccine_id?: number
  // Feeding specific
  feed_type_id?: number
  feeding_times?: { time: string; percentage: number }[]
  notes?: string
}
export interface NewScheduleForm<ScheduleItem> {
  name: string
  description: string
  schedule_type: "medication" | "vaccination" | "feeding"
  poultry_type_id: number,
  farm_id: number,
  items: ScheduleItem[]
}
export interface PaginatedRequestType <dataType>  {
  success: boolean;
  data?: dataType[];
  current_page?: number;
  total_pages?: number;
  total_records?: number;
  per_page?: number;
  error?: string[];
}
export interface getFarmStatsResponseData {
  success : boolean,
  data ? : FarmStatsDataType,
  error? : string[]
}
export interface LoadFarmDataType {
  farmStats : getFarmStatsResponseData  ,
  currentFarm  : Farm | null   
}
export interface route {
       path: string;
       loader?:  (params?: any) => Promise<any>;
       element: React.ReactNode;
}
export interface PoultryDashboardResponse {
  success: boolean;
  data?: PoultryDashboardData;
  error?: string[]
};

export interface RequestResponse <dataType> {

  success: boolean;
  data?: dataType;
  error?: string[];
}
export interface LoadPoultryOverviewDataType{
  
    PoultryStatistics : PoultryDashboardResponse
    currentFarm : Farm | null 
}
export interface LoadFlockDataType{
  PoultryStatistics : PoultryDashboardResponse;
    currentFarm : Farm | null ;
    Flock : DetailedFlockRecord
}
