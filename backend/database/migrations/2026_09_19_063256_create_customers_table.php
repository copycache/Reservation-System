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
        Schema::create('customers', function (Blueprint $table) {
            $table->id("customer_id");
            $table->string("name");
            $table->string("facebook_name");
            $table->string("email");
            $table->integer("phone_number")->nullable();
            $table->integer("total_bookings")->default(0);
            $table->decimal('total_spent', 10, 2)->default(0);
            $table->timestamp("last_booking_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
