<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Court;
use Illuminate\Http\Request;

class CourtController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $courts = Court::get();

        return response()->json($courts);
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

        $court_payload = [
            'court_name' => $request->input('court_name'),
            'type' => $request->input('type'),
            'capacity' => $request->input('capacity'),
            'status' => $request->input('status'),
            'created_at' => now(),
        ];

        $court = Court::create($court_payload);

        return response()->json($court);
    }

    /**
     * Display the specified resource.
     */
    public function show(Court $court)
    {
        //
        $court = Court::findOrFail($court->court_id);

        return response()->json($court);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Court $court)
    {
        //
        $court->update([
            'court_name' => $request->input('court_name'),
            'type' => $request->input('type'),
            'capacity' => $request->input('capacity'),
            'status' => $request->input('status'),
        ]);
        return response()->json($court);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Court $court)
    {
        //
    }
}
