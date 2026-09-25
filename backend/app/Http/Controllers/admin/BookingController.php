<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $bookings = Booking::with(['customers', 'bookingSlots'])->get();

        return response()->json($bookings);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        //
        $booking->load(['customers', 'bookingSlots']);

        return response()->json($booking);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Booking $booking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        $action = $request->input('action');
        $booking->load(['customers', 'bookingSlots']);
        
        if ($action === 'approve') {
            $booking->status = 'approved';
            $booking->payment_status = 'approved';
            
            foreach ($booking->bookingSlots as $bookingSlot) {
                $bookingSlot->update([
                    'status' => "booked",
                ]);

                $bookingSlot->save();
            }
        } elseif ($action === 'disapprove') {
            $booking->status = 'cancelled';
            $booking->payment_status = 'cancelled';

            foreach ($booking->bookingSlots as $bookingSlot) {
                $bookingSlot->update([
                    'status' => "cancelled",
                ]);

                $bookingSlot->save();
            }
        }

        $booking->save();

        $booking->load(['customers', 'bookingSlots']);
        
        return response()->json($booking);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking)
    {
        //
    }
}
