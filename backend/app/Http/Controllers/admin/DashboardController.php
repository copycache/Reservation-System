<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Customer;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $bookings = BookingSlot::with(['bookings.customers'])->where("status", "!=","open")->get();
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
        $court_id = $request->input('court_id', 1);
        $slots = json_decode($request->input('slots'), true);
        $status = $request->input('status', 'booked');

        // Conflict check
        foreach ($slots as $slot) {
            $conflict = BookingSlot::where('court_id', $court_id)
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
                    'message' => 'One or more selected slots are already booked.',
                ], 409);
            }
        }

        $customer = Customer::create([
            'name' => $request->input('name'),
            'facebook_name' => $request->input('fb_name'),
            'email' => $request->input('email'),
        ]);

        $bookings = Booking::create([
            'booking_number' => 'BK-' . now()->format('Ymd') . '-' . random_int(10000, 99999),
            'customer_id' => $customer->customer_id,
            'subtotal' => $request->input('total'),
            'total_amount' => $request->input('total'),
            'payment_proof' => 'admin_created', // Admin created (cannot be null)
            'status' => 'approved',
            'payment_status' => 'approved',
            'created_at' => now(),
        ]);

        foreach ($slots as $slot) {
            BookingSlot::create([
                'booking_id' => $bookings->booking_id,
                'court_id' => $court_id,
                'date' => $slot['date'],
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'price' => $slot['subtotal'],
                'status' => $status,
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(BookingSlot $bookingSlot)
    {
        //
        return $bookingSlot;
    }

    /**
     * Show the form for editing the specified resource.
     */
    // public function edit(Payment $payment)
    // {
    //     //
    // }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingSlot $bookingSlot)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'court_id' => 'required|integer',
            'name' => 'required|string',
            'fb_name' => 'nullable|string',
            'email' => 'required|email',
        ]);

        $bookingSlot->update([
            'status' => $validated['status'],
            'court_id' => $validated['court_id'],
        ]);

        if ($bookingSlot->bookings && $bookingSlot->bookings->customers) {
            $bookingSlot->bookings->customers->update([
                'name' => $validated['name'],
                'facebook_name' => $validated['fb_name'] ?? '',
                'email' => $validated['email'],
            ]);
        }

        return response()->json($bookingSlot->load('bookings.customers'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BookingSlot $bookingSlot)
    {
        //
    }
}
