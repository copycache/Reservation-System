<?php

namespace Database\Seeders;

use App\Models\PricingRule;
use App\Models\PricingRuleSchedule;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PricingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pricingRules = [
            [
                'name' => 'Peak Rate (Morning)',
                'type' => 'hourly',
                'price' => 300,
                'priority' => 10,
                'status' => 'active',

                'schedules' => [
                    [
                        'day_of_week' => 'mon',
                        'start_time' => '08:00:00',
                        'end_time' => '15:00:00',
                    ],
                    [
                        'day_of_week' => 'tue',
                        'start_time' => '08:00:00',
                        'end_time' => '15:00:00',
                    ],
                    [
                        'day_of_week' => 'wed',
                        'start_time' => '08:00:00',
                        'end_time' => '15:00:00',
                    ],
                    [
                        'day_of_week' => 'thu',
                        'start_time' => '08:00:00',
                        'end_time' => '15:00:00',
                    ],
                    [
                        'day_of_week' => 'fri',
                        'start_time' => '08:00:00',
                        'end_time' => '15:00:00',
                    ],
                ],
            ],
            [
                'name' => 'Peak Rate (Afternoon)',
                'type' => 'hourly',
                'price' => 400,
                'priority' => 10,
                'status' => 'active',

                'schedules' => [
                    [
                        'day_of_week' => 'mon',
                        'start_time' => '15:00:00',
                        'end_time' => '00:00:00',
                    ],
                    [
                        'day_of_week' => 'tue',
                        'start_time' => '15:00:00',
                        'end_time' => '00:00:00',
                    ],
                    [
                        'day_of_week' => 'wed',
                        'start_time' => '15:00:00',
                        'end_time' => '00:00:00',
                    ],
                    [
                        'day_of_week' => 'thu',
                        'start_time' => '15:00:00',
                        'end_time' => '00:00:00',
                    ],
                    [
                        'day_of_week' => 'fri',
                        'start_time' => '15:00:00',
                        'end_time' => '00:00:00',
                    ],
                ],
            ],
        ];

        foreach ($pricingRules as $data) {
            $pricingRule = PricingRule::firstOrCreate(
                [
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'price' => $data['price'],
                    'priority' => $data['priority'],
                    'status' => $data['status'],
                ]
            );

            foreach ($data['schedules'] as $schedule) {
                PricingRuleSchedule::firstOrCreate(
                    [
                        'pricing_rule_id' => $pricingRule->pricing_rule_id,
                        'day_of_week' => $schedule['day_of_week'],
                        'start_time' => $schedule['start_time'],
                        'end_time' => $schedule['end_time'],
                    ]
                );
            }
        }
    }
}
