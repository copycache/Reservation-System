<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $pricing_rule = PricingRule::with(['courts', 'pricingRuleSchedules'])->get();

        return response()->json($pricing_rule);
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
    public function show(PricingRule $pricing)
    {
        //
        $pricing_rules = PricingRule::findOrFail($pricing->pricing_rule_id);

        return response()->json($pricing_rules);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PricingRule $pricing_rule)
    {
        //
        $pricing_rule->update([
            'court_name' => $request->input('court_name'),
            'type' => $request->input('type'),
            'capacity' => $request->input('capacity'),
            'status' => $request->input('status'),
        ]);
        return response()->json($pricing_rule);
    }

    // /**
    //  * Remove the specified resource from storage.
    //  */
    // public function destroy(Pricing $pricing)
    // {
    //     //
    // }
}
