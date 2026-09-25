<?php

namespace App\Models;

use App\Models\BookingSlot;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    //
    use HasFactory;

    public $timestamps = false;

    protected $primaryKey = 'booking_id';

    protected $table = 'bookings';

    protected $guarded = [];

    public function customers(){
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function bookingSlots()
    {
        return $this->hasMany(
            BookingSlot::class,
            'booking_id',
            'booking_id'
        );
    }
}
