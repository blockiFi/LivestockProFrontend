export type User = {
    
      id: string;
      email: string;
      name: string;
      email_verified_at: string | null,
      phone: string | null,
      profile_photo: string | null,
      created_at: string | null,
      updated_at: string | null,
      farms? : Farm[],
      roles?: Role[],
      permissions?: Permission[],
      impersonation?: {
        active: boolean;
        impersonated_by?: { id: number; name: string; email: string } | null;
        expires_at?: string | null;
      } | null;
    

}

export type UserSettings = {
  id: number
  user_id: number
  theme: "light" | "dark" | "system"
  locale: string
  timezone: string
  date_format: string
  notify_schedules: boolean
  notify_low_stock: boolean
  notify_mortality: boolean
  created_at: string
  updated_at: string
}

export type FarmSettings = {
  id: number
  farm_id: number
  currency_code: string
  currency_symbol: string
  timezone: string
  date_format: string
  fiscal_year_start_month: number
  invoice_prefix: string
  invoice_next_number: number
  invoice_tax_enabled: boolean
  invoice_tax_rate: number | string
  invoice_payment_instructions: string | null
  invoice_footer_note: string | null
  schedule_reminder_days: number
  low_stock_alerts_enabled: boolean
  mortality_alert_percent: number | string
  created_at: string
  updated_at: string
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "waived"
  | "past_due"
  | "grace"
  | "read_only"
  | "cancelled"

export type SubscriptionPlan = {
  slug: string
  name: string
  description: string | null
  price: number
  price_kobo: number
  currency: string
  /** Null means unlimited. */
  max_users: number | null
  /** Null means unlimited. */
  max_active_flocks: number | null
  ai_enabled: boolean
}

export type SubscriptionUsage = {
  users: number
  pending_invitations: number
  user_seats_used: number
  active_flocks: number
  max_users: number | null
  max_active_flocks: number | null
}

export type SubscriptionWaiverSummary = {
  plan_name: string | null
  months: number
  starts_at: string
  ends_at: string
  reason: string | null
}

export type FarmSubscriptionSummary = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  is_read_only: boolean
  ai_enabled: boolean
  trial_ends_at: string | null
  current_period_end: string | null
  waived_until: string | null
  cancelled_at: string | null
  ends_at: string | null
  waiver: SubscriptionWaiverSummary | null
  usage: SubscriptionUsage
  billing_url: string
}

export type SubscriptionTransaction = {
  id: number
  farm_id: number
  source: string
  event: string | null
  amount_kobo: number | null
  currency: string | null
  status: string | null
  reference: string | null
  created_at: string
  plan?: { slug: string; name: string } | null
}

export type PaystackCheckout = {
  authorization_url: string
  access_code: string
  reference: string
}

export type FarmUserRoleSummary = {
  id: number;
  name: string;
  email: string;
  roles: Array<{
    id: number;
    name: string;
    permissions: string[];
  }>;
  permissions: string[];
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
    completed_flocks?: number;
    sold_flocks?: number;
    culled_flocks?: number;
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
    actual_quantity?: number;
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
  current_occupancy?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  poultry_type?: PoultryType;
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
  actual_quantity: number;
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
  product?: MedicationProduct;

}
export type VaccineInventory = {
  id: number;
  poultry_vaccine_product_id: number;
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
  product?: VaccineProduct;

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
  min_weight_grams: number;
  max_weight_grams: number;
  sample_size: number;
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
  recorded_by_name?: string | null;
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
  updated_at: string; 
  items : ScheduleItem[]       // ISO datetime string
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
  items: feedingScheduleItem[];
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
    /** @deprecated Prefer start_day; kept as legacy mirror of start_day. */
    feeding_day?: number;
    start_day: number;
    /** null = open-ended (applies indefinitely from start_day). */
    end_day: number | null;
    is_open_ended?: boolean;
    day_count?: number | null;
    quantity: number;        // e.g., "60.00"
    created_at: string;      // ISO timestamp
    updated_at: string;      // ISO timestamp
    feed_type?: FeedType;
}
export type BatchFeedingScheduleItem = {
  id: number;
  feeding_batch_schedule_id: number;
  feeding_schedule_item_id: number;
  actual_feeding_time: string;  // JSON string of FeedingTimeEntry[]
  actual_quantity: string;      // Per-bird grams, e.g. "50.00"
  actual_total_kg?: number | string | null; // Total kg actually used (from daily record / feed usage)
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

export type MissedFeedingDay = {
  feeding_day: number;
  feeding_date: string;
  feeding_schedule_item_id: number;
  feed_type_id: number;
  feed_type_name: string;
  planned_quantity: number;
  feeding_times: FeedingTime[];
  planned_total_kg: number;
}

export type FeedInventoryRequirement = {
  feed_type_id: number;
  feed_type_name: string;
  total_feed_kg: number;
  missed_days_count: number;
  available_stock_kg?: number;
  has_auto_inventory: boolean;
  auto_inventory_id: number | null;
  needs_selection: boolean;
}

export type MissedFeedingDaysPreview = {
  missed_days: MissedFeedingDay[];
  total_feed_kg: number;
  count: number;
  inventory_requirements: FeedInventoryRequirement[];
}

export type ImplementMissedFeedingResult = {
  created_count: number;
  skipped_count: number;
  total_feed_kg: number;
  items: BatchFeedingScheduleItem[];
  inventory_warnings: string[];
  daily_records_created: number;
  daily_records_updated: number;
}

export type RevertibleFeedingDay = {
  id: number;
  feeding_day: number;
  feeding_date: string;
  feeding_schedule_item_id: number;
  actual_quantity: number;
  planned_total_kg: number;
}

export type RevertibleFeedingDaysPreview = {
  revertible_days: RevertibleFeedingDay[];
  total_feed_kg: number;
  count: number;
}

export type RevertMissedFeedingResult = {
  reverted_count: number;
  total_feed_kg: number;
  inventory_restored_kg: number;
  daily_records_deleted?: number;
  daily_records_updated?: number;
}

export type ScheduleItem =  {
  id: number;
  schedule_id: number;
  age_days: number;
  is_recurring?: boolean;
  interval_days?: number | null;
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
  min_stock_level : number,
  farm_id: number | null;
  type: string; // e.g., "default"
  poultry_type_id: number;
  name: string; // e.g., "Starter"
  description: string;
  start_age: number | null;
  end_age: number | null;
  /** Effective range for the current farm (override or default). */
  effective_start_age?: number | null;
  effective_end_age?: number | null;
  has_farm_override?: boolean;
  default_start_age?: number | null;
  default_end_age?: number | null;
  poultry_type?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type FeedAgeRangeUpdatePayload = {
  poultry_feed_type_id: number
  start_age: number
  end_age: number | null
}
export type FeedInventoryType = {
    id: number;
    farm_id: number;
    poultry_feed_type_id: number;
    quantity: string;
    available_quantity: string; // original stocked quantity
    batch_number: string;
    manufacturer: string;
    manufacture_date: string | null;
    expiry_date: string;
    status: string;
    damaged_quantity?: number | string;
    closed_at?: string | null;
    close_notes?: string | null;
    allocated_flock_id?: number | null;
    allocated_flock?: { id: number; name?: string; batch_number?: string };
    last_restocked: string;
    unit_cost: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    created_by: number | null;
    feed_usages_count?: number;
    can_delete?: boolean;
    last_usage_date?: string | null;
    feed_type?: FeedType;
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
  recorded_by_name?: string | null;
  usage_date: string;
  created_at: string;
  updated_at: string;
  has_expenditure?: boolean;
  feed_inventory?: FeedInventoryType;
  feed_type?: FeedType;
  flock?: Pick<FlockRecord, 'id' | 'name' | 'batch_number'>;
}




export type DetailedFlockRecord = FlockRecord & {
  daily_records: PoultryDailyReport[];
  mortality_reports: MortalityReport[];
  weight_reports: WeightReport[];
  egg_reports: EggReport[];
  batch_vaccination_schedules: BatchSchedule[];
  batch_medication_schedules: BatchSchedule[];
  batch_feeding_schedules: BatchFeedingSchedule[];
  batch_schedules: BatchSchedule;
  poultry_medication_records: PoultryMedicationRecord[];
  poultry_vaccination_records: PoultryVaccinationRecord[];
  poultry_feed_usages: PoultryFeedUsageRecord[];
  flock_expenditures: FlockExpenditure[];
  flock_sales: FlockSale[];
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
  
export type FeedingSchedule = {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  type: 'default' | 'user';
  farm_id?: number | null;
  poultry_type_id?: number | null;
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

export type FlockExpenditure = {
  id: number;
  farm_id: number;
  flock_id: number;
  category: 'feed' | 'medication' | 'vaccination' | 'labour' | 'transport' | 'utilities' | 'equipment' | 'housing' | 'chicks' | 'maintenance' | 'other' | string;
  amount: number;
  currency: string | null;
  description: string | null;
  payment_method?: string | null;
  reference_no?: string | null;
  date: string; // ISO date string
  source_type: string | null;
  source_id: number | null;
  created_at: string;
  updated_at: string;
};

export type FlockExpenditureSummary = {
  total_cost: number;
  auto_total: number;
  manual_total: number;
  entry_count: number;
  cost_per_bird: number;
  bird_count: number;
  by_category: { category: string; total_cost: number; percentage: number }[];
  cost_by_date: { date: string; total_cost: number }[];
  date_from?: string | null;
  date_to?: string | null;
};

export type FlockSale = {
  id: number;
  farm_id: number;
  flock_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
  customer_id?: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  daily_record_id: number | null;
  culls_applied: number;
  created_at: string;
  updated_at: string;
};

export type FlockProfitLoss = {
  flock_id: number;
  flock_name: string;
  total_revenue: number;
  live_bird_revenue?: number;
  product_revenue?: number;
  total_cost: number;
  net_profit: number;
  margin_percent: number;
  birds_sold: number;
  average_sale_price: number;
  revenue_by_type?: RevenueByType;
  revenue_by_date: { date: string; revenue: number; birds_sold: number }[];
  cost_by_category: { category: string; total_cost: number }[];
};

export type FlockPerformanceMetrics = {
  mortality_rate: number;
  feed_conversion_ratio: number;
  egg_production_rate: number;
  weight_gain_rate: number;
};

export type FlockAiRecommendation = {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
};

export type FlockAiInsights = {
  executive_summary: string;
  performance_score: "good" | "fair" | "poor";
  strengths: string[];
  risks: string[];
  recommendations: FlockAiRecommendation[];
  benchmark_comparison?: string | null;
};

export type FlockMetricsAiResponse = {
  metrics_snapshot: Record<string, unknown>;
  ai_insights: FlockAiInsights | null;
  ai_analysis: string | null;
  ai_available: boolean;
};

export type FlockComparativeMetrics = {
  mortality_rate_percent: number;
  survival_rate_percent: number;
  days_in_flock: number;
  age_days: number;
  feed_kg: number;
  feed_per_bird_kg: number;
  feed_conversion_ratio: number | null;
  weight_gain_rate_g_per_day: number;
  latest_weight_g: number | null;
  egg_production_rate_percent: number;
  total_eggs: number;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  margin_percent: number;
  cost_per_bird: number;
  birds_sold: number;
};

export type FlockComparativeRow = {
  id: number;
  name: string;
  batch_number: string;
  status: string;
  breed?: string;
  metrics: FlockComparativeMetrics;
};

export type FlockComparativeAggregate = {
  target: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  median: number | null;
  rank: number | null;
  percentile: number | null;
  delta_vs_avg: number | null;
  peer_count: number;
};

export type FlockComparativeAiInsights = {
  executive_summary: string;
  peer_ranking_summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: FlockAiRecommendation[];
};

export type FlockComparativeReport = {
  cached: boolean;
  generated_at?: string | null;
  peer_count: number;
  poultry_type: string;
  poultry_kind: "broiler" | "layer" | "dual" | "other";
  target_flock: FlockComparativeRow;
  peers: FlockComparativeRow[];
  aggregates: Record<string, FlockComparativeAggregate>;
  highlights: {
    strengths: string[];
    gaps: string[];
  };
  ai_insights: FlockComparativeAiInsights | null;
};

export type RevenueByType = {
  live_bird: number;
  egg: number;
  meat: number;
  manure: number;
};

export type SalesRecord = {
  id: number;
  farm_id: number;
  flock_id: number | null;
  type: 'egg' | 'meat' | 'manure' | string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'partial' | string;
  notes: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  flock?: { id: number; name: string; batch_number?: string | null } | null;
  customer?: { id: number; name: string } | null;
};

export type FarmSalesProfitLoss = {
  date_from: string;
  date_to: string;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  margin_percent: number;
  birds_sold: number;
  revenue_by_type?: RevenueByType;
  time_series: {
    date: string;
    revenue: number;
    cost: number;
    net_profit: number;
    revenue_live_bird?: number;
    revenue_products?: number;
  }[];
  cost_by_category: { category: string; total_cost: number }[];
  flocks: {
    flock_id: number;
    flock_name: string;
    batch_number: string | null;
    status: string;
    live_bird_revenue?: number;
    product_revenue?: number;
    total_revenue: number;
    total_cost: number;
    net_profit: number;
    birds_sold: number;
  }[];
};

export type DashboardKpis = {
  total_birds: number;
  active_birds: number;
  active_flocks: number;
  total_flocks: number;
  feed_kg: number;
  feed_cost: number;
  eggs: number;
  mortality: number;
  mortality_rate_percent: number;
  fcr: number;
  revenue: number;
  cost: number;
  net_profit: number;
  margin_percent: number;
  cost_per_bird: number;
};

export type DashboardSeriesPoint = {
  date: string;
  feed_kg: number;
  feed_cost: number;
  eggs: number;
  mortality: number;
  mortality_rate: number;
  revenue: number;
  cost: number;
  net_profit: number;
};

export type DashboardFlockRow = {
  id: number;
  name: string;
  batch_number: string | null;
  poultry_type: string;
  status: string;
  age_days: number;
  birds: number;
  mortality_percent: number;
  fcr: number;
  feed_kg: number;
  feed_cost: number;
  revenue: number;
  net_profit: number;
};

export type DashboardDistribution = {
  type_id: number;
  type_name: string;
  birds: number;
  flock_count: number;
  percent: number;
};

export type FarmAlertSeverity = "critical" | "warning" | "info";
export type FarmAlertCategory = "low_stock" | "expiring" | "upcoming_schedule" | "mortality_spike" | string;

export type FarmAlert = {
  id: string;
  severity: FarmAlertSeverity;
  category: FarmAlertCategory;
  title: string;
  detail: string;
  date: string | null;
  flock_id: number | null;
  flock_name: string | null;
  link: string | null;
};

export type FarmAlerts = {
  counts: { critical: number; warning: number; info: number };
  items: FarmAlert[];
  settings?: {
    schedule_reminder_days: number;
    low_stock_alerts_enabled: boolean;
    mortality_alert_percent: number;
  };
};

export type FarmDashboard = {
  meta: {
    start_date: string;
    end_date: string;
    period_days: number;
    previous_start_date: string;
    previous_end_date: string;
    generated_at: string;
  };
  kpis: DashboardKpis;
  previous_period: DashboardKpis;
  series: DashboardSeriesPoint[];
  flock_distribution: DashboardDistribution[];
  flocks: DashboardFlockRow[];
  cost_by_category: { category: string; total_cost: number }[];
  alerts: FarmAlerts;
};

export type DashboardDatePreset = "7d" | "30d" | "90d" | "ytd" | "lifetime" | "custom";

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

export type PoultryFeedProduct = {
  id: number;
  farm_id: number | null;
  poultry_feed_type_id: number | null;
  name: string;
  sku?: string | null;
  description?: string | null;
  unit?: string;
  price?: number;
  status?: string;
  // Nutritional fields (optional / nullable)
  crude_protein?: number | null;
  crude_fat?: number | null;
  crude_fiber?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  metabolizable_energy?: number | null;
  moisture?: number | null;
  ash?: number | null;
  created_at?: string;
  updated_at?: string;
  feed_type?: FeedType;
};

export type FeedComponent = {
  id: number;
  farm_id: number | null;
  name: string;
  description?: string | null;
  unit: string;
  crude_protein?: number | null;
  crude_fat?: number | null;
  crude_fiber?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  metabolizable_energy?: number | null;
  moisture?: number | null;
  ash?: number | null;
  status: "active" | "inactive" | string;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type FeedComposition = {
  id: number;
  poultry_feed_product_id: number;
  feed_component_id: number;
  percentage: number;
  component?: FeedComponent;
  created_at?: string;
  updated_at?: string;
};


export type Permission = {
  id: number;
  name: string;
  guard_name: string;
  group_id: number;
  created_at: string;
  updated_at: string;
}
export type PermissionGroup =  {
  id: number;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export type Role = {
  id: number;
  name: string; 
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}
export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: number
  invoiceNumber: string
  date: string
  dueDate: string
  status: "Paid" | "Pending" | "Overdue"
  clientName: string
  clientEmail: string
  customerId?: number
  items: InvoiceItem[]
  subtotal: number
  tax: number
  taxRate?: number
  taxEnabled?: boolean
  total: number
  notes: string
  paymentInstructions?: string
}

export interface CustomerSummary {
  product_sale_count: number
  flock_sale_count: number
  invoice_count: number
  product_revenue: number
  flock_revenue: number
  invoice_total: number
  total_revenue: number
  last_purchase_at: string | null
}

export interface Customer {
  id: number
  farm_id: number
  name: string
  company_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  is_active: boolean
  country_id: number
  country?: { id: number; name: string; iso_code?: string | null }
  summary?: CustomerSummary
  created_at?: string
  updated_at?: string
}

export interface CustomerHistoryItem {
  type: "product" | "flock" | "invoice"
  id: number
  date: string | null
  description: string
  amount: number
  meta?: Record<string, unknown>
}

export interface ApiInvoiceItem {
  id?: number
  invoice_id?: number
  description: string
  quantity: number
  unit_price: number | string
  total: number | string
}

export interface ApiInvoice {
  id: number
  farm_id: number
  customer_id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal: number | string
  tax_amount: number | string
  total: number | string
  status: "pending" | "paid" | "overdue"
  notes?: string | null
  customer?: Customer
  items?: ApiInvoiceItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Schedule Import Drafts
// ─────────────────────────────────────────────────────────────────────────────

export type ScheduleImportItemDraft = {
  id?: number;
  kind: "vaccination" | "medication" | "feeding";
  age_days: number | null;
  feeding_day: number | null;
  start_day?: number | null;
  end_day?: number | null;
  name: string | null;
  dose: number | null;
  withdrawal_period_days: number | null;
  storage_instructions: string | null;
  description: string | null;
  feed_type_id: number | null;
  quantity: number | null;
  feeding_times: Array<{ time: string; percentage: number }>;
  confidence: number | null;
  notes: string | null;
};

export type ScheduleImportDraft = {
  id: number;
  farm_id: number;
  created_by: number;
  source_type: "pdf" | "image";
  source_path: string;
  status: "draft" | "confirmed" | "failed";
  feeding_layout?: "range" | "per_day" | null;
  feeding_layout_reason?: string | null;
  llm_provider?: string | null;
  llm_model?: string | null;
  llm_raw_response?: string | null;
  items?: ScheduleImportItemDraft[];
  created_at?: string;
  updated_at?: string;
};

// ── Farm Task Management ───────────────────────────────────────────────────

export type FarmTaskSection =
  | "layers"
  | "broilers"
  | "turkeys"
  | "goats"
  | "pigs"
  | "medication"
  | "feeding"
  | "cleaning"
  | "general"
  | "mixed";

export type FarmTaskPriority = "low" | "medium" | "high" | "critical";

export type FarmTaskRecurrence = "none" | "daily" | "weekly" | "monthly" | "custom";

export type FarmTaskAssignmentMode = "single" | "alternating" | "all";

export type FarmTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled"
  | "skipped";

export type FarmTaskTemplate = {
  id: number;
  farm_id: number;
  title: string;
  description?: string | null;
  section: FarmTaskSection;
  priority: FarmTaskPriority;
  instructions?: string | null;
  notes?: string | null;
  animal_group?: string | null;
  medication_name?: string | null;
  dosage_instructions?: string | null;
  require_completion_confirmation: boolean;
  require_supervisor_approval: boolean;
  require_signature: boolean;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type FarmTaskScheduleAssignee = {
  id: number;
  schedule_id: number;
  user_id: number;
  sort_order: number;
  user?: { id: number; name: string; email?: string };
};

export type FarmTaskSchedule = {
  id: number;
  farm_id: number;
  template_id?: number | null;
  title: string;
  description?: string | null;
  section: FarmTaskSection;
  priority: FarmTaskPriority;
  instructions?: string | null;
  notes?: string | null;
  start_date: string;
  end_date?: string | null;
  indefinite: boolean;
  start_time?: string | null;
  due_time?: string | null;
  recurrence: FarmTaskRecurrence;
  repeat_interval: number;
  days_of_week?: number[] | null;
  month_day?: number | null;
  assignment_mode: FarmTaskAssignmentMode;
  flock_id?: number | null;
  animal_group?: string | null;
  medication_name?: string | null;
  dosage_instructions?: string | null;
  require_completion_confirmation: boolean;
  require_supervisor_approval: boolean;
  require_signature: boolean;
  is_active: boolean;
  reminders_enabled?: boolean;
  reminders?: FarmTaskReminder[];
  created_by?: number | null;
  assignees?: FarmTaskScheduleAssignee[];
  template?: { id: number; title: string } | null;
  created_at?: string;
  updated_at?: string;
};

export type FarmTaskCompletion = {
  id: number;
  instance_id: number;
  completed_by: number;
  completed_at: string;
  notes?: string | null;
  worker_confirmed: boolean;
  signature_text?: string | null;
  supervisor_approved: boolean;
  approved_by?: number | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  completed_by_user?: { id: number; name: string };
  approved_by_user?: { id: number; name: string };
};

export type FarmTaskInstance = {
  id: number;
  farm_id: number;
  schedule_id?: number | null;
  title: string;
  description?: string | null;
  section: FarmTaskSection;
  priority: FarmTaskPriority;
  instructions?: string | null;
  notes?: string | null;
  scheduled_date: string;
  start_time?: string | null;
  due_time?: string | null;
  status: FarmTaskStatus;
  assigned_to_user_id?: number | null;
  flock_id?: number | null;
  animal_group?: string | null;
  medication_name?: string | null;
  dosage_instructions?: string | null;
  require_completion_confirmation: boolean;
  require_supervisor_approval: boolean;
  require_signature: boolean;
  awaiting_approval: boolean;
  started_at?: string | null;
  started_by?: number | null;
  occurrence_index?: number | null;
  assignee?: { id: number; name: string; email?: string } | null;
  completion?: FarmTaskCompletion | null;
  schedule?: { id: number; title: string; recurrence?: string; assignment_mode?: string } | null;
};

export type FarmTaskStats = {
  total: number;
  pending: number;
  in_progress: number;
  completed_today: number;
  overdue: number;
  due_today: number;
  medication: number;
  awaiting_approval: number;
};

export type FarmTaskNotification = {
  id: number;
  farm_id: number;
  user_id: number;
  instance_id?: number | null;
  type: string;
  title: string;
  body?: string | null;
  payload?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at?: string;
  instance?: { id: number; title: string; scheduled_date?: string; status?: string } | null;
};

export type FarmTaskSchedulePayload = {
  template_id?: number | null;
  title: string;
  description?: string;
  section: FarmTaskSection;
  priority?: FarmTaskPriority;
  instructions?: string;
  notes?: string;
  start_date: string;
  end_date?: string | null;
  indefinite?: boolean;
  start_time?: string | null;
  due_time?: string | null;
  recurrence?: FarmTaskRecurrence;
  repeat_interval?: number;
  days_of_week?: number[] | null;
  month_day?: number | null;
  assignment_mode?: FarmTaskAssignmentMode;
  assignee_ids?: number[];
  flock_id?: number | null;
  animal_group?: string;
  medication_name?: string;
  dosage_instructions?: string;
  require_completion_confirmation?: boolean;
  require_supervisor_approval?: boolean;
  require_signature?: boolean;
  is_active?: boolean;
  reminders_enabled?: boolean;
  reminders?: number[];
};

export type FarmTaskReminder = {
  id: number;
  offset_minutes: number;
  label?: string | null;
  resolved_label?: string;
  is_active?: boolean;
};

export type AppNotificationPriority = "low" | "normal" | "high" | "critical";
export type AppNotificationCategory =
  | "tasks"
  | "farm_operations"
  | "medication"
  | "inventory"
  | "system"
  | "account";

export type AppNotification = {
  id: number;
  farm_id?: number | null;
  user_id: number;
  type: string;
  category: AppNotificationCategory | string;
  priority: AppNotificationPriority | string;
  title: string;
  body?: string | null;
  action_url?: string | null;
  action_label?: string | null;
  instance_id?: number | null;
  section?: string | null;
  payload?: Record<string, unknown> | null;
  status?: string;
  read_at?: string | null;
  dismissed_at?: string | null;
  is_read?: boolean;
  created_at?: string;
  farm?: { id: number; name: string } | null;
  instance?: {
    id: number;
    title: string;
    scheduled_date?: string;
    status?: string;
    section?: string;
    priority?: string;
  } | null;
};

export type NotificationSummary = {
  unread: number;
  total: number;
  high_priority_unread: number;
  categories: Record<string, number>;
  latest: AppNotification[];
};

export type NotificationCatalogGroup = {
  category: string;
  label: string;
  types: Array<{
    type: string;
    label: string;
    description?: string;
    priority: string;
    default_channels: string[];
    mandatory: boolean;
    locked_channels: string[];
    supported_channels?: string[];
  }>;
};

export type NotificationPreferenceRow = {
  in_app: boolean;
  email: boolean;
  locked: string[];
  mandatory: boolean;
  enabled_by_admin: boolean;
};

export type UserNotificationSettings = {
  sound_enabled: boolean;
  browser_push_enabled: boolean;
  email_enabled: boolean;
  digest_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
};

export type NotificationPreferencesPayload = {
  catalog: NotificationCatalogGroup[];
  preferences: Record<string, NotificationPreferenceRow>;
  settings: UserNotificationSettings;
  farm_id?: number | null;
};

export type FarmNotificationTypeSetting = {
  type: string;
  label: string;
  category: string;
  enabled: boolean;
  mandatory: boolean;
  default_in_app: boolean;
  default_email: boolean;
  priority: string;
  locked_channels: string[];
  catalog_mandatory: boolean;
};

export type FarmNotificationConfig = {
  default_task_reminders?: number[];
  escalation_enabled?: boolean;
  escalate_to_manager_after_minutes?: number;
  escalate_high_priority_after_minutes?: number;
  notify_managers_on_completion?: boolean;
  notify_managers_on_overdue?: boolean;
  email_max_attempts?: number;
};

export type FarmNotificationSettingsPayload = {
  catalog: NotificationCatalogGroup[];
  types: FarmNotificationTypeSetting[];
  config: FarmNotificationConfig;
  reminder_presets?: number[];
};

export type NotificationAnalytics = {
  window_days: number;
  notifications_sent: number;
  notifications_read: number;
  notifications_unread: number;
  read_rate: number;
  email_queued: number;
  email_sent: number;
  email_retrying: number;
  email_failed: number;
  email_cancelled: number;
  task_reminders_sent: number;
  overdue_alerts: number;
  reminders_pending: number;
  by_category?: Record<string, number>;
  top_types?: Record<string, number>;
  recent_failures?: Array<{
    id: number;
    channel: string;
    target?: string | null;
    attempts: number;
    error?: string | null;
    failed_at?: string | null;
  }>;
};

export type EquipmentCategory = {
  id: number;
  farm_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  sort_order?: number;
};

export type EquipmentStatus =
  | "available"
  | "in_use"
  | "assigned"
  | "under_maintenance"
  | "damaged"
  | "inactive"
  | "lost_missing"
  | "retired"
  | "disposed";

export type EquipmentCondition =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "damaged"
  | "unserviceable";

export type Equipment = {
  id: number;
  farm_id: number;
  category_id?: number | null;
  asset_id: string;
  name: string;
  equipment_type?: string | null;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  description?: string | null;
  quantity?: number;
  unit?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  supplier?: string | null;
  invoice_reference?: string | null;
  purchase_order_number?: string | null;
  payment_status?: string | null;
  warranty_period_months?: number | null;
  warranty_expires_at?: string | null;
  farm_section?: string | null;
  location?: string | null;
  department?: string | null;
  poultry_house_id?: number | null;
  assigned_to_user_id?: number | null;
  assigned_at?: string | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  placed_in_service_date?: string | null;
  expected_useful_life_months?: number | null;
  current_usage_value?: number | null;
  usage_metric?: string | null;
  last_inspection_date?: string | null;
  next_inspection_date?: string | null;
  maintenance_interval_days?: number | null;
  next_maintenance_date?: string | null;
  last_maintenance_date?: string | null;
  total_maintenance_cost?: number;
  total_repair_cost?: number;
  total_other_cost?: number;
  total_cost?: number;
  warranty_active?: boolean;
  profile_url?: string;
  category?: EquipmentCategory | null;
  assignee?: { id: number; name: string; email?: string } | null;
  assignments?: EquipmentAssignment[];
  transfers?: EquipmentTransfer[];
  maintenance_logs?: EquipmentMaintenanceLog[];
  inspections?: EquipmentInspection[];
  documents?: EquipmentDocument[];
  activity_logs?: EquipmentActivityLog[];
  retirement?: EquipmentRetirement | null;
  created_at?: string;
  updated_at?: string;
};

export type EquipmentAssignment = {
  id: number;
  assigned_to_user_id?: number | null;
  farm_section?: string | null;
  location?: string | null;
  department?: string | null;
  assigned_at?: string;
  released_at?: string | null;
  notes?: string | null;
  is_current?: boolean;
  assignee?: { id: number; name: string } | null;
  assigned_by?: { id: number; name: string } | null;
};

export type EquipmentTransfer = {
  id: number;
  previous_location?: string | null;
  new_location?: string | null;
  previous_section?: string | null;
  new_section?: string | null;
  transferred_at?: string;
  reason?: string | null;
  notes?: string | null;
  previous_assignee?: { id: number; name: string } | null;
  new_assignee?: { id: number; name: string } | null;
  transferred_by?: { id: number; name: string } | null;
};

export type EquipmentMaintenanceLog = {
  id: number;
  maintenance_type?: string;
  title?: string | null;
  description?: string | null;
  performed_at: string;
  next_due_at?: string | null;
  service_provider?: string | null;
  technician?: string | null;
  parts_replaced?: string | null;
  labour_cost?: number;
  parts_cost?: number;
  total_cost?: number;
  notes?: string | null;
  performer?: { id: number; name: string } | null;
};

export type EquipmentInspection = {
  id: number;
  inspection_date: string;
  condition?: EquipmentCondition;
  findings?: string | null;
  problems_identified?: string | null;
  recommended_action?: string | null;
  notes?: string | null;
  next_inspection_date?: string | null;
  inspector?: { id: number; name: string } | null;
};

export type EquipmentDocument = {
  id: number;
  document_type: string;
  name: string;
  storage_path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  expires_at?: string | null;
  uploaded_by?: number | null;
  uploader?: { id: number; name: string } | null;
  created_at?: string;
};

export type EquipmentRetirement = {
  id: number;
  disposal_method: string;
  disposal_date: string;
  reason?: string | null;
  final_condition?: string | null;
  sale_price?: number | null;
  buyer_recipient?: string | null;
  notes?: string | null;
};

export type EquipmentActivityLog = {
  id: number;
  action: string;
  summary: string;
  meta?: Record<string, unknown> | null;
  created_at: string;
  actor?: { id: number; name: string } | null;
  equipment?: { id: number; asset_id: string; name: string };
};

export type EquipmentDashboardStats = {
  total: number;
  active: number;
  in_use: number;
  available: number;
  under_maintenance: number;
  damaged: number;
  retired: number;
  lost_missing: number;
  total_purchase_value: number;
  requiring_maintenance: number;
  expiring_warranty: number;
  purchased_this_month: number;
};

export type EquipmentDashboard = {
  stats: EquipmentDashboardStats;
  recent_activity: EquipmentActivityLog[];
  upcoming_maintenance: Equipment[];
  recent_assignments: EquipmentAssignment[];
  recent_retirements: Equipment[];
  charts: {
    by_category: Array<{ category_id: number | null; count: number; category?: EquipmentCategory }>;
    by_status: Array<{ status: string; count: number }>;
    by_condition: Array<{ condition: string; count: number }>;
    value_by_category: Array<{ category_id: number | null; total: number; category?: EquipmentCategory }>;
  };
};
