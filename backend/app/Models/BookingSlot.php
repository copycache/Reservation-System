<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingSlot extends Model
{
    //
    use HasFactory;

    public $timestamps = false;

    protected $primaryKey = 'booking_slot_id';

    protected $table = 'booking_slots';

    protected $guarded = [];

    public function customers(){
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function bookings()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }
}
