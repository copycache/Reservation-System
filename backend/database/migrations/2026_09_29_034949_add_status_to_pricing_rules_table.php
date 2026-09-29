<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a `status` enum column and populates it from the existing `is_active`
     * boolean, then removes the old boolean column.
     */
    public function up(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table) {
            // Add the new status column (nullable first so the ALTER doesn't fail on existing rows)
            $table->enum('status', ['active', 'maintenance', 'unavailable'])
                  ->nullable()
                  ->after('is_active');
        });

        // Migrate existing data: true → 'active', false → 'maintenance'
        DB::table('pricing_rules')->update([
            'status' => DB::raw("CASE WHEN is_active = 1 THEN 'active' ELSE 'maintenance' END"),
        ]);

        Schema::table('pricing_rules', function (Blueprint $table) {
            // Now that every row has a status, make it non-nullable with a default
            $table->enum('status', ['active', 'maintenance', 'unavailable'])
                  ->default('active')
                  ->nullable(false)
                  ->change();

            // Drop the old boolean column
            $table->dropColumn('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores `is_active` from `status` and removes the `status` column.
     */
    public function down(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->boolean('is_active')->nullable()->default(null)->after('priority');
        });

        DB::table('pricing_rules')->update([
            'is_active' => DB::raw("CASE WHEN status = 'active' THEN 1 ELSE 0 END"),
        ]);

        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->nullable(false)->change();
            $table->dropColumn('status');
        });
    }
};
