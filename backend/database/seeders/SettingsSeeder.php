<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $setting_data = [
            [
                'key' => 'storeName',
                'value' => 'Sample Court',
            ],
            [
                'key' => 'GcashNumber',
                'value' => '09123456789',
            ],
            [
                'key' => 'GcashName',
                'value' => 'Sample****',
            ],
        ];

        foreach ($setting_data as $data) {
            Setting::firstOrCreate(
                [
                    'key' => $data['key'],
                    'value' => $data['value'],
                ]
            );
        }
    }
}
