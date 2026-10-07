<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    // return view('welcome');
    $origins = config('cors.allowed_origins');

    return redirect($origins);
});
