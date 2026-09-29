<?php

namespace Database\Seeders;

use App\Models\Court;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CourtSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Court::firstOrCreate([
            'court_name' => "Home Court",
            'type' => "Pickleball",
            'capacity' => 0,
            'status' => "active",
        ]);
    }
}
