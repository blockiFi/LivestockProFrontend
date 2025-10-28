export type User = {
    
      id: string;
      email: string;
      name: string;
      email_verified_at: string | null,
      phone: string | null,
      profile_photo: string | null,
      created_at: string | null,
      updated_at: string | null,
      farms? : Farm[] 
    

}

export type Role = {

}
export type Permission = {

}
export type Country = {
            id: number,
            iso_code: string,
            name: string,
            currency_code: string,
            currency_name: string,
            currency_symbol: string,
            status: string,
            created_at: string,
            updated_at: string,
}
export type Farm = {
    
        id : number,
        name: string,
        address: string,
        city: string,
        state: string,
        country_id: number,
        postal_code: string,
        phone: string,
        email: string,
        website: string,
        registration_number: string,
        tax_id: string | null,
        size_hectares: string,
        established_date: string,
        created_by: string | null,
        logo: string | null,
        status: number,
        created_at: string,
        updated_at: string,
       
        country?: Country
    
}
export type AuthResponse = {
    success : boolean,
    data? : User,
    token? : string,
    error? : string[]
}

export type WeatherDataType = {
    "temp": "",
    "feels_like": "",
    "temp_min": "",
    "temp_max": "",
    "pressure": 0,
    "humidity": 0,
    "id" : 300,
    "description" : ""
  }
export type FarmStatsDataType  = {
        total_poultry_houses: number,
        total_flocks: number,
        total_customers: number,
        total_sales: number,
        active_schedules: number,
        total_medication_inventory: number,
        total_vaccine_inventory: number,
        total_feed_inventory: number
}

export type DateRange = {
    start_date: string;
    end_date: string;
    period_days: number;
  };
  
  export type Summary = {
    total_birds: number;
    total_flocks: number;
    active_birds: number;
    active_flocks: number;
    date_range: DateRange;
  };
  
  export type PoultryTypeSummary = {
    type_id: number;
    type_name: string;
    total_birds: number;
    flock_count: number;
    percentage_of_total: number;
  };
  
  export type FeedBreakdown = {
    date: string;
    total_feed_kg: number;
    flocks_count: number;
  };
  
  export type FeedConsumption = {
    total_feed_consumed_kg: number;
    total_feed_cost: number;
    average_daily_feed_kg: number;
    average_daily_feed_per_bird_kg: number;
    feed_conversion_ratio: number;
    daily_breakdown: FeedBreakdown[];
  };
  
  export type MortalityBreakdown = {
    date: string;
    mortality_count: number;
    total_birds: number;
    mortality_rate_percent: number;
    flocks_count: number;
  };
  
  export type Mortality = {
    total_mortality: number;
    average_daily_mortality: number;
    average_mortality_rate_percent: number;
    mortality_reports_count: number;
    daily_breakdown: MortalityBreakdown[];
  };
  
  export type EggProductionBreakdown = {
    date: string;
    eggs_produced: number;
    flocks_count: number;
  };
  
  export type EggProduction = {
    total_eggs_produced: number;
    average_daily_eggs: number;
    daily_breakdown: EggProductionBreakdown[];
  };
  
  export type WeightMetrics = {
    average_weight_grams: number;
    max_weight_grams: number;
    min_weight_grams: number;
    weight_gain_grams: number;
  };
  
  export type FlockPerformance = {
    total_flocks: number;
    active_flocks: number;
    completed_flocks: number;
    average_flock_size: number;
    average_flock_age_days: number;
  };
  
  export type Performance = {
    flock_performance: FlockPerformance;
  };
  
  export type Financial = {
    total_feed_cost: number;
    average_daily_feed_cost: number;
    cost_per_bird: number;
  };
  
  export type FlockDetail = {
    id: number;
    name: string;
    batch_number: string;
    poultry_type: string;
    quantity: number;
    arrival_date: string;
    age_days: number;
    status: string;
    stage: string;
  };
  export type PoultryType = {
  id: number;
  name: string;
  scientific_name: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  average_lifespan_days: number | null;
  average_weight_kg: number | null;
  is_active: number;
};

export type FlockStage = {
  id: number;
  poultry_type_id: number;
  name: string;
  description: string;
  from_age: number;
  to_age: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PoultryHouse = {
  id: number;
  farm_id: number;
  name: string;
  poultry_type_id: number;
  liter_type_id: string;
  capacity: number;
  dimensions: string | null;
  construction_date: string;
  last_maintenance_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type FlockType ={ 
  id: number;
  farm_id: number;
  house_id: number;
  poultry_weight_report_frequency_id: number | null;
  poultry_type_id: number;
  flock_stage_id: number;
  name: string;
  batch_number: string;
  breed: string;
  source: string;
  quantity: number;
  arrival_date: string;
  arrival_age_days: number;
  status: string;
  expected_end_date: string;
  actual_end_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
export type  FlockRecord = FlockType & {
  poultry_type: PoultryType;
  flock_stage: FlockStage;
  poultry_house: PoultryHouse;
};
export type Medication  = {
  id: number;
  farm_id: number | null;
  type: string; // e.g., "default"
  name: string;
  description: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MedicationData = Medication & {
  products: MedicationProduct[];
};
export type MedicationProduct = {
  id: number;
  farm_id: number | null;
  poultry_medication_id: number;
  name: string;
  image_url: string | null;
  manufacturer: string;
  administration_method_id: number;
  withdrawal_period: number;
  withdrawal_period_unit: string; // e.g., "days"
  dosage: string;
  created_at: string;
  updated_at: string;
  inventory? : MedicationInventory[];
  min_stock_level?: number;
};



export type MedicationInventory  = {
  id: number;
  medication_product_id: number;
  farm_id: number;
  quantity: number; // or number, depending on your backend design
  available_quantity: number; // current available quantity
  manufacturer: string;
  notes: string;
  batch_number: string;
  status: string; // e.g., "available"
  manufacture_date: string | null;
  last_restocked: string | null;
  expiry_date: string;
  unit_cost: number; // or number
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
}

export type AdministrationMethod =  {
  id: number;
  name: string; // e.g., "Wing-Web"
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export  type PoultryDailyReport = {
  id: number;
  farm_id: number;
  flock_id: number;
  date: string; // ISO date string (e.g., "2024-12-28")
  mortality: number;
  culls: number;
  feed_consumed_kg: number; // can be changed to number if always numeric
  water_consumed_liters: number; // can be number
  avg_weight_grams: number; // can be number
  min_temperature: number; // can be number
  max_temperature: number; // can be number
  humidity: number; // can be number
  light_hours: number; // can be number
  eggs_collected: number;
  eggs_broken: number;
  notes: string;
  recorded_by: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at: string | null;
}
export type MortalityReport = {
  id: number;
  farm_id: number;
  flock_id: number;
  poultry_type_id: number;
  mortality_count: number;
  average_weight: number;
  mortality_percentage: number; // can be number if numeric consistently
  bird_count: number;
  date: string; // e.g., "2025-06-27"
  recorded_by: number;
  notes: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  
}
export type WeightReport = {
  id: number;
  farm_id: number;
  flock_id: number;
  average_weight: number; // or number, if always numeric
  min_weight: number;     // or number
  max_weight: number;     // or number
  number_of_birds: number;
  sample_size: number;
  report_date: string;    // ISO datetime string
  recorded_by: number;
  notes: string;
  created_at: string;     // ISO datetime string
  updated_at: string;     // ISO datetime string
  deleted_at: string | null;
}
export type EggReport = {
  id: number;
  farm_id: number;
  flock_id: number;
  eggs_collected: number;
  average_egg_weight: string;      // can be number if numeric only
  production_percentage: string;   // can be number
  bird_count: number;
  recorded_by: number;
  notes: string;
  date: string;                    // e.g., "2025-06-27"
  created_at: string;              // ISO timestamp
  updated_at: string;     

}
export type Schedule = {
  id: number;
  schedule_type: string;       // e.g., "medication"
  poultry_type_id: number;
  type: string;                // e.g., "default"
  farm_id: number;
  name: string;
  description: string;
  created_at: string;          // ISO datetime string
  updated_at: string;          // ISO datetime string
}

export type DetailedSchedule =Schedule & {
  items : feedingScheduleItem[]
}

export type feedingSchedule = {
  id: number;
  title: string;
  description: string;
  start_date: string; // Format: YYYY-MM-DD
  end_date: string;   // Format: YYYY-MM-DD
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
interface FeedingTime {
  time: string;       // Format: "HH:MM"
  percentage: number; // e.g., 40 means 40% of daily feed
}
export type feedingScheduleItem = {
  

    id: number;
    feeding_schedule_id: number;
    feed_type_id: number;
    feeding_times: FeedingTime[];
    feeding_day: number;
    quantity: number;        // e.g., "60.00"
    created_at: string;      // ISO timestamp
    updated_at: string;      // ISO timestamp
  
}
export type BatchFeedingScheduleItem = {
  id: number;
  feeding_batch_schedule_id: number;
  feeding_schedule_item_id: number;
  actual_feeding_time: string;  // JSON string of FeedingTimeEntry[]
  actual_quantity: string;      // E.g., "50.00"
  feeding_date: string;
  status: 'scheduled' | 'completed' | 'missed' | string;
  created_at: string;
  updated_at: string;
  schedule_item : feedingScheduleItem
}
export interface FeedingTimeEntry {
  time: string;       // Format: "HH:MM"
  percentage: number;
}

export type BatchFeedingSchedule = {
  id: number;
  flock_id: number;
  feeding_schedule_id: number;
  status: 'scheduled' | 'ongoing' | 'completed' | string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  schedule : feedingSchedule,
  items : BatchFeedingScheduleItem[]
}

export type ScheduleItem =  {
  id: number;
  schedule_id: number;
  age_days: number;
  poultry_vaccine_id: number | null;
  poultry_medication_id: number | null;
  name: string;
  dose: number;
  dose_unit : string ; // e.g., "mL", "grams"
  withdrawal_period_days: number;
  storage_instructions: string;
  description: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export type  BatchScheduleItem = {
  id: number;
  batch_schedule_id: number;
  schedule_item_id: number;
  status: string; // e.g., "scheduled", "completed", etc.
  scheduled_date: string; // e.g., "2025-07-15"
  actual_date: string | null;
  administered_by: number | null;
  poultry_vaccine_product_id: number | null;
  vaccine_product_batch_id: number | null;
  poultry_medication_id: number | null;
  dosage: number;
  quantity: number; // consider number if always numeric
  cost: number;     // consider number if always numeric
  notes: string;
  administration_method_id: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  schedule_item: ScheduleItem;
}
export type BatchSchedule = {
  id: number;
  farm_id: number;
  status: string;       // e.g., "active", "completed", etc.
  flock_id: number;
  schedule_id: number;
  created_at: string;   // ISO datetime string
  updated_at: string;   // ISO datetime string
  schedule: Schedule;
  items: BatchScheduleItem[];
}


export type PoultryMedicationRecord = {
  id: number;
  farm_id: number;
  flock_id: number;
  poultry_medication_id: number;
  poultry_medication_inventory_id: number;
  date: string;                // ISO datetime string, e.g. "2025-06-27T00:00:00.000000Z"
  administered_by: string;     // e.g., "Vet 4"
  dosage: number;
  dosage_unit: string;         // e.g., "mL"
  quantity: number;            // consider number if always numeric
  cost: number;                // consider number if always numeric
  notes: string;
  administration_method_id: number;
  created_at: string;          // ISO datetime string
  updated_at: string;
  medication: Medication; 
  medication_inventory: MedicationInventory; 
  administration_method: AdministrationMethod; 
}
export type vaccine = {
    id: number;
    name: string;
    type: string; // e.g., "default"
    farm_id: number | null;
    description: string;
    administration_age: number | null;
    created_at: string;
    updated_at: string;
  }
  export type PoultryVaccineInventory = {
     id: number;
    poultry_vaccine_product_id: number;
    farm_id: number;
    quantity: string;
    available_quantity: string; // current available quantity
    status: string; // e.g., "available"
    manufacturer: string;
    notes: string;
    batch_number: string;
    manufacture_date: string | null;
    last_restocked: string;
    expiry_date: string;
    unit_cost: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    created_by: number | null;
  }
export type FeedType = {
  id: number;
  farm_id: number | null;
  type: string; // e.g., "default"
  poultry_type_id: number;
  name: string; // e.g., "Starter"
  description: string;
  start_age: number | null;
  end_age: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export type FeedInventoryType = {
    id: number;
    farm_id: number;
    poultry_feed_type_id: number;
    quantity: string;
    available_quantity: string; // current available quantity
    batch_number: string;
    manufacturer: string;
    manufacture_date: string | null;
    expiry_date: string;
    status: string;
    last_restocked: string;
    unit_cost: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    created_by: number | null;
    poultry_feed_type?: FeedType;
  };
export type PoultryFeedUsageRecord =  {
  id: number;
  farm_id: number;
  poultry_feed_inventory_id: number;
  poultry_feed_type_id: number;
  flock_id: number;
  quantity: number;
  unit_cost: number;
  created_by: number;
  usage_date: string;
  created_at: string;
  updated_at: string;
  feed_inventory: FeedInventoryType;
  feed_type: FeedType;
  flock: FlockRecord;
}




export type DetailedFlockRecord = FlockRecord & {
  daily_records: PoultryDailyReport[];
  mortality_reports: MortalityReport[];
  weight_reports: WeightReport[];
  egg_reports: EggReport[];
  batch_vaccination_schedules: BatchSchedule[];
  batch_medication_schedules: BatchSchedule[];
  batch_feeding_schedules : BatchFeedingSchedule[];
  batch_schedules: BatchSchedule;
  poultry_medication_records: PoultryMedicationRecord[];
  poultry_vaccination_records: PoultryVaccinationRecord[];
  poultry_feed_usages: PoultryFeedUsageRecord[];

};
  export type PoultryDashboardData = {
    summary: Summary;
    poultry_types: PoultryTypeSummary[];
    feed_consumption: FeedConsumption;
    mortality: Mortality;
    egg_production: EggProduction;
    weight_metrics: WeightMetrics;
    performance: Performance;
    financial: Financial;
    flock_details: FlockDetail[];
  };
  
  export type feedConsumptionDataType = {
    date : string, 
    feed_kg : number , 
    cost :number
  };
  export type mortalityDataType =  {
    date : string, 
    mortality : number , 
    rate :number
  }
  
  export type eggProductionDataType = {
    date : string,
     eggs : number
  }
  export type PoultryBreakDownReportRequestType = {
    
      eggProductionData  : eggProductionDataType[] ,
      mortalityData :mortalityDataType[],
      feedConsumptionData :feedConsumptionDataType[]
    
  }
export type FeedingSchedule = {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  type: 'default' | 'user';
  farm_id?: number | null;
  items: feedingScheduleItem[];
};

export type PoultryVaccinationRecord ={
  id: number;
  farm_id: number;
  flock_id: number;
  poultry_vaccine_id: number;
  poultry_vaccine_inventory_id: number;
  date: string; // ISO datetime string
  administered_by: number;
  dosage: number;
  dosage_unit: string; // e.g., "drops"
  quantity: number; // often returned as string from DB
  cost: number; // same as quantity
  notes: number;
  administration_method_id: number;
  created_at: string;
  updated_at: string;
  vaccine: vaccine;
  vaccine_inventory: PoultryVaccineInventory;
  administration_method: AdministrationMethod;
}
export type VaccineProduct = {
  id: number;
  farm_id: number | null;
  poultry_vaccine_id: number;
  name: string;
  image_url: string | null;
  manufacturer: string;
  administration_method_id?: number;
  withdrawal_period?: number;
  withdrawal_period_unit?: string; // e.g., "days"
  dosage?: string | number;
  dosage_unit?: string;
  created_at: string;
  updated_at: string;
  min_stock_level?: number;
  inventories?: PoultryVaccineInventory[];
};

export type VaccineData = vaccine & {
  products: VaccineProduct[];
};



