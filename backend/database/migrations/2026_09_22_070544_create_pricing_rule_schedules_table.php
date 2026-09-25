<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pricing_rule_schedules', function (Blueprint $table) {
            $table->id('pricing_rule_schedule_id');

            $table->unsignedBigInteger('pricing_rule_id');
            $table->foreign('pricing_rule_id')->references('pricing_rule_id')->on('pricing_rules')->onDelete('cascade');

            $table->string('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rule_schedules');
    }
};
