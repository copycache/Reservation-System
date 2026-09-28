<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    //
    use HasFactory;

    public $timestamps = true;

    protected $primaryKey = 'pricing_rule_id';

    protected $table = 'pricing_rules';

    protected $guarded = [];

    /**
     * The court this rule applies to.
     * Null means the rule applies to all courts.
     */
    public function court(){
        return $this->belongsTo(Court::class, 'court_id', 'court_id');
    }

    /**
     * The day/time schedules that define when this pricing rule is active.
     * foreignKey = pricing_rule_id (on pricing_rule_schedules)
     * localKey   = pricing_rule_id (on pricing_rules)
     */
    public function pricingRuleSchedules()
    {
        return $this->hasMany(
            PricingRuleSchedule::class,
            'pricing_rule_id',
            'pricing_rule_id'
        );
    }
}
