<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    // return view('welcome');
    $currentUrl = url()->current();

    $result = preg_replace('/\d+$/', '', $currentUrl);

    $origins = $result . '3000';

    return redirect($origins);
});
