import type { BatchFeedingSchedule } from "@/lib/types";

export const generateMockFeedingSchedules = (): BatchFeedingSchedule[] => {
  const currentDate = new Date();
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + 30);

  return [
    {
      id: 1,
      flock_id: 1,
      feeding_schedule_id: 1,
      status: 'ongoing',
      created_at: currentDate.toISOString(),
      updated_at: currentDate.toISOString(),
      schedule: {
        id: 1,
        title: 'Broiler Starter Feed Program',
        description: 'Comprehensive feeding schedule for broiler chickens in their first 21 days',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: futureDate.toISOString().split('T')[0],
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString(),
        items: []
      },
      items: [
        {
          id: 1,
          feeding_batch_schedule_id: 1,
          feeding_schedule_item_id: 1,
          actual_feeding_time: JSON.stringify([
            { time: "06:00", percentage: 25 },
            { time: "12:00", percentage: 35 },
            { time: "18:00", percentage: 40 }
          ]),
          actual_quantity: "50.00",
          feeding_date: currentDate.toISOString().split('T')[0],
          status: 'completed',
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString(),
          schedule_item: {
            id: 1,
            feeding_schedule_id: 1,
            feed_type_id: 1,
            feeding_times: [
              { time: "06:00", percentage: 25 },
              { time: "12:00", percentage: 35 },
              { time: "18:00", percentage: 40 }
            ],
            feeding_day: 1,
            start_day: 1,
            end_day: 1,
            quantity: 50,
            created_at: currentDate.toISOString(),
            updated_at: currentDate.toISOString()
          }
        },
        {
          id: 2,
          feeding_batch_schedule_id: 1,
          feeding_schedule_item_id: 2,
          actual_feeding_time: JSON.stringify([
            { time: "06:00", percentage: 25 },
            { time: "12:00", percentage: 35 },
            { time: "18:00", percentage: 40 }
          ]),
          actual_quantity: "45.00",
          feeding_date: new Date(currentDate.getTime() + 24*60*60*1000).toISOString().split('T')[0],
          status: 'scheduled',
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString(),
          schedule_item: {
            id: 2,
            feeding_schedule_id: 1,
            feed_type_id: 1,
            feeding_times: [
              { time: "06:00", percentage: 25 },
              { time: "12:00", percentage: 35 },
              { time: "18:00", percentage: 40 }
            ],
            feeding_day: 2,
            start_day: 2,
            end_day: 2,
            quantity: 45,
            created_at: currentDate.toISOString(),
            updated_at: currentDate.toISOString()
          }
        }
      ]
    },
    {
      id: 2,
      flock_id: 2,
      feeding_schedule_id: 2,
      status: 'scheduled',
      created_at: currentDate.toISOString(),
      updated_at: currentDate.toISOString(),
      schedule: {
        id: 2,
        title: 'Layer Feed Maintenance Program',
        description: 'Daily feeding schedule for laying hens to maintain optimal egg production',
        start_date: new Date(currentDate.getTime() + 7*24*60*60*1000).toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + 37*24*60*60*1000).toISOString().split('T')[0],
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString(),
        items: []
      },
      items: [
        {
          id: 3,
          feeding_batch_schedule_id: 2,
          feeding_schedule_item_id: 3,
          actual_feeding_time: JSON.stringify([
            { time: "07:00", percentage: 50 },
            { time: "16:00", percentage: 50 }
          ]),
          actual_quantity: "120.00",
          feeding_date: new Date(currentDate.getTime() + 7*24*60*60*1000).toISOString().split('T')[0],
          status: 'scheduled',
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString(),
          schedule_item: {
            id: 3,
            feeding_schedule_id: 2,
            feed_type_id: 2,
            feeding_times: [
              { time: "07:00", percentage: 50 },
              { time: "16:00", percentage: 50 }
            ],
            feeding_day: 1,
            start_day: 1,
            end_day: 1,
            quantity: 120,
            created_at: currentDate.toISOString(),
            updated_at: currentDate.toISOString()
          }
        }
      ]
    },
    {
      id: 3,
      flock_id: 3,
      feeding_schedule_id: 3,
      status: 'completed',
      created_at: new Date(currentDate.getTime() - 30*24*60*60*1000).toISOString(),
      updated_at: currentDate.toISOString(),
      schedule: {
        id: 3,
        title: 'Grower Feed Transition',
        description: 'Transitional feeding program for growing chickens from 22 to 42 days',
        start_date: new Date(currentDate.getTime() - 30*24*60*60*1000).toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() - 1*24*60*60*1000).toISOString().split('T')[0],
        created_at: new Date(currentDate.getTime() - 30*24*60*60*1000).toISOString(),
        updated_at: currentDate.toISOString(),
        items: []
      },
      items: [
        {
          id: 4,
          feeding_batch_schedule_id: 3,
          feeding_schedule_item_id: 4,
          actual_feeding_time: JSON.stringify([
            { time: "06:30", percentage: 30 },
            { time: "12:30", percentage: 40 },
            { time: "17:30", percentage: 30 }
          ]),
          actual_quantity: "80.00",
          feeding_date: new Date(currentDate.getTime() - 1*24*60*60*1000).toISOString().split('T')[0],
          status: 'completed',
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString(),
          schedule_item: {
            id: 4,
            feeding_schedule_id: 3,
            feed_type_id: 3,
            feeding_times: [
              { time: "06:30", percentage: 30 },
              { time: "12:30", percentage: 40 },
              { time: "17:30", percentage: 30 }
            ],
            feeding_day: 21,
            start_day: 21,
            end_day: 21,
            quantity: 80,
            created_at: currentDate.toISOString(),
            updated_at: currentDate.toISOString()
          }
        }
      ]
    }
  ];
};
