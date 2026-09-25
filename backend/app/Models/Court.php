<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Court extends Model
{
    //
    use HasFactory;

    public $timestamps = false;

    protected $primaryKey = 'court_id';

    protected $table = 'courts';

    protected $guarded = [];
}
