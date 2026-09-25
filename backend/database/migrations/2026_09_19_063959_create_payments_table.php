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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->foreign('booking_id')->references('booking_id')->on('bookings')->onDelete('cascade');
            $table->string('method');
            $table->string('reference_number')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('proof_url')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('verified_by');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('cascade');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
