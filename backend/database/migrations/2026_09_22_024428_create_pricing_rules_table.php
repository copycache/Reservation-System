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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id('pricing_rule_id');

            $table->unsignedBigInteger('court_id')->nullable()->change();
            $table->foreign('court_id')->references('court_id')->on('courts')->onDelete('cascade');

            $table->string('name');
            $table->string('type');
            $table->decimal('price', 10, 2);
            $table->integer('priority')->default(0);
             $table->enum('status', ['active', 'maintenance', 'unavailable'])
                  ->default('active')
                  ->nullable(false)
                  ->change();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricings');
    }
};
