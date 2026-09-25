<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingRuleSchedule extends Model
{
    //
    use HasFactory;

    public $timestamps = false;

    protected $primaryKey = 'pricing_rule_schedule_id';

    protected $table = 'pricing_rule_schedules';

    protected $guarded = [];
}
