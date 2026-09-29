<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use App\Models\PricingRuleSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PricingController extends Controller
{
    /**
     * Display a listing of all pricing rules (admin).
     */
    public function index(): JsonResponse
    {
        $pricingRules = PricingRule::with(['court', 'pricingRuleSchedules'])
            ->orderBy('priority')
            ->get();

        return response()->json($pricingRules);
    }

    /**
     * Public listing of active pricing rules (no auth required).
     * Used by the homepage schedule table to generate dynamic time slots.
     */
    public function publicIndex(): JsonResponse
    {
        $pricingRules = PricingRule::with('pricingRuleSchedules')
            ->where('status', 'active')
            ->orderBy('priority')
            ->get();

        return response()->json($pricingRules);
    }

    /**
     * Store a newly created pricing rule in storage.
     *
     * Expects:
     *   pricing_name   string
     *   court          string  ("all" | "court_1" | "court_2" | "court_3")
     *   days           array   (["mon","tue",...])
     *   start_time     string  (HH:mm)
     *   end_time       string  (HH:mm)
     *   price_per_hour numeric
     *   priority       integer
     *   status         string  ("active" | "close")
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pricing_name'  => ['required', 'string', 'max:255'],
            'court'         => ['required', 'string'],
            'days'          => ['required', 'array', 'min:1'],
            'days.*'        => ['string', 'in:mon,tue,wed,thu,fri,sat,sun'],
            'start_time'    => ['required', 'date_format:H:i'],
            'end_time'      => ['required', 'date_format:H:i', 'after:start_time'],
            'price_per_hour'=> ['required', 'numeric', 'min:0'],
            'priority'      => ['required', 'integer', 'min:0'],
            'status'        => ['required', 'string', 'in:active,maintenance,unavailable'],
        ]);

        $courtId = $this->resolveCourtId($validated['court']);

        DB::transaction(function () use ($validated, $courtId, &$pricingRule) {
            $pricingRule = PricingRule::create([
                'court_id'  => $courtId,
                'name'      => $validated['pricing_name'],
                'type'      => 'standard',
                'price'     => $validated['price_per_hour'],
                'priority'  => $validated['priority'],
                'status'    => $validated['status'],
            ]);

            $this->syncSchedules($pricingRule, $validated['days'], $validated['start_time'], $validated['end_time']);
        });

        return response()->json(
            $pricingRule->load(['court', 'pricingRuleSchedules']),
            201
        );
    }

    /**
     * Display the specified pricing rule with its schedules.
     */
    public function show(PricingRule $pricing): JsonResponse
    {
        return response()->json(
            $pricing->load(['court', 'pricingRuleSchedules'])
        );
    }

    /**
     * Update the specified pricing rule in storage.
     * Old schedules are deleted and replaced with the new set.
     */
    public function update(Request $request, PricingRule $pricing): JsonResponse
    {
        $validated = $request->validate([
            'pricing_name'  => ['required', 'string', 'max:255'],
            'court'         => ['required', 'string'],
            'days'          => ['required', 'array', 'min:1'],
            'days.*'        => ['string', 'in:mon,tue,wed,thu,fri,sat,sun'],
            'start_time'    => ['required', 'date_format:H:i'],
            'end_time'      => ['required', 'date_format:H:i', 'after:start_time'],
            'price_per_hour'=> ['required', 'numeric', 'min:0'],
            'priority'      => ['required', 'integer', 'min:0'],
            'status'        => ['required', 'string', 'in:active,maintenance,unavailable'],
        ]);

        $courtId = $this->resolveCourtId($validated['court']);

        DB::transaction(function () use ($validated, $courtId, $pricing) {
            $pricing->update([
                'court_id'  => $courtId,
                'name'      => $validated['pricing_name'],
                'price'     => $validated['price_per_hour'],
                'priority'  => $validated['priority'],
                'status'    => $validated['status'],
            ]);

            // Delete old schedules and re-insert the new set.
            $pricing->pricingRuleSchedules()->delete();
            $this->syncSchedules($pricing, $validated['days'], $validated['start_time'], $validated['end_time']);
        });

        return response()->json(
            $pricing->fresh(['court', 'pricingRuleSchedules'])
        );
    }

    /**
     * Remove the specified pricing rule and its schedules (cascade).
     */
    public function destroy(PricingRule $pricing): JsonResponse
    {
        // Schedules are cascade-deleted via the DB foreign key constraint.
        $pricing->delete();

        return response()->json(['message' => 'Pricing rule deleted successfully.']);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Convert the frontend court slug to a court_id.
     * "all" → null (applies to all courts)
     * "court_1" → 1, "court_2" → 2, etc.
     */
    private function resolveCourtId(string $court): ?int
    {
        if ($court === 'all') {
            return null;
        }

        // Extract the numeric suffix: "court_1" → 1
        $id = (int) str_replace('court_', '', $court);

        return $id > 0 ? $id : null;
    }

    /**
     * Insert a PricingRuleSchedule row for each selected day.
     *
     * @param  PricingRule  $rule
     * @param  array        $days       e.g. ["mon", "tue", "fri"]
     * @param  string       $startTime  e.g. "15:00"
     * @param  string       $endTime    e.g. "22:00"
     */
    private function syncSchedules(PricingRule $rule, array $days, string $startTime, string $endTime): void
    {
        $records = array_map(fn (string $day) => [
            'pricing_rule_id' => $rule->pricing_rule_id,
            'day_of_week'     => $day,
            'start_time'      => $startTime,
            'end_time'        => $endTime,
            'created_at'      => now(),
            'updated_at'      => now(),
        ], $days);

        PricingRuleSchedule::insert($records);
    }
}
