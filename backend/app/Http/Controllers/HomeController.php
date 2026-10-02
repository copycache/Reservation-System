<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Customer;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $bookingSlots = BookingSlot::with(['bookings', 'customers'])->where("status", "!=","open")->get();

        return response()->json($bookingSlots);
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
        $request->validate([
            // Database Table
        ]);

        $court_ids_input = $request->input('court_ids');
        if (is_string($court_ids_input)) {
            $court_ids = json_decode($court_ids_input, true);
        } else {
            $court_ids = $court_ids_input;
        }
        
        if (empty($court_ids)) {
            $court_ids = [$request->input('court_id', 1)];
        }

        $slots = json_decode($request->input('slots'), true);

        // ── Conflict check: reject if any slot is already taken for these courts ──
        foreach ($court_ids as $c_id) {
            foreach ($slots as $slot) {
                $conflict = BookingSlot::where('court_id', $c_id)
                    ->where('date', $slot['date'])
                    ->where('start_time', $slot['start_time'])
                    ->where('end_time', $slot['end_time'])
                    ->whereNotIn('status', ['open'])
                    ->whereHas('bookings', function ($q) {
                        $q->where('status', '!=', 'cancelled');
                    })
                    ->exists();

                if ($conflict) {
                    return response()->json([
                        'message' => 'One or more of your selected slots are already booked for this court. Please choose a different court or time slot.',
                    ], 409);
                }
            }
        }

        $customer_payload = [
            'name' => $request->input('name'),
            'facebook_name' => $request->input('fb_name'),
            'email' => $request->input('email'),
        ];

        $customer = Customer::create($customer_payload);

        $file = $request->file('payment');

        $paymentPath = $file->store('payment_proofs', 'public');

        $bookings_payload = [
            'booking_number' => 'BK-' . now()->format('Ymd') . '-' . random_int(10000, 99999),
            'customer_id' => $customer->customer_id,
            'subtotal' => $request->input('total'),
            'total_amount' => $request->input('total'),
            'payment_proof' => $paymentPath,
            'created_at' => now(),
        ];

        $bookings = Booking::create($bookings_payload);

        foreach ($court_ids as $c_id) {
            foreach ($slots as $slot) {
                BookingSlot::create([
                    'booking_id' => $bookings->booking_id,
                    'court_id' => $c_id,
                    'date' => $slot['date'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'price' => $slot['subtotal'],
                    'created_at' => now(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $customer,
                'booking' => $bookings,
                'slots' => BookingSlot::where('booking_id', $bookings->booking_id)->get(),
            ]
        ]);
    }

    /**
     * Display the specified resource.
     */
    // public function show(Payment $payment)
    // {
    //     //
    // }

    // /**
    //  * Show the form for editing the specified resource.
    //  */
    // public function edit(Payment $payment)
    // {
    //     //
    // }

    // /**
    //  * Update the specified resource in storage.
    //  */
    // public function update(Request $request, Payment $payment)
    // {
    //     //
    // }

    // /**
    //  * Remove the specified resource from storage.
    //  */
    // public function destroy(Payment $payment)
    // {
    //     //
    // }
}
