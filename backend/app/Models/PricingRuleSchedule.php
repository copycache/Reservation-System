<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingRuleSchedule extends Model
{
    //
    use HasFactory;

    public $timestamps = true;

    protected $primaryKey = 'pricing_rule_schedule_id';

    protected $table = 'pricing_rule_schedules';

    protected $guarded = [];

    /**
     * The pricing rule this schedule belongs to.
     */
    public function pricingRule()
    {
        return $this->belongsTo(
            PricingRule::class,
            'pricing_rule_id',
            'pricing_rule_id'
        );
    }
}
