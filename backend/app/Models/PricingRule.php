<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    //
    use HasFactory;

    public $timestamps = false;

    protected $primaryKey = 'pricing_rule_id';

    protected $table = 'pricing_rules';

    protected $guarded = [];

    public function courts(){
        return $this->belongsTo(Court::class, 'court_id', 'court_id');
    }

    public function pricingRuleSchedules()
    {
        return $this->hasMany(
            PricingRuleSchedule::class,
            'pricing_rule_schedule_id',
            'pricing_rule_schedule_id'
        );
    }
}
