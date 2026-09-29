<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;

use App\Http\Controllers\HomeController;

use App\Http\Controllers\admin\BookingController;
use App\Http\Controllers\admin\DashboardController;
use App\Http\Controllers\admin\CourtController;
use App\Http\Controllers\admin\PricingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [RegisteredUserController::class, 'register']);
Route::post('/login', [AuthenticatedSessionController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'logout']);
});

Route::get('/home_bookings', [HomeController::class, 'index']);
Route::post('/home_bookings', [HomeController::class, 'store']);

// Public pricing rules — used by the homepage to generate dynamic time slots (no auth required).
Route::get('/public/pricings', [PricingController::class, 'publicIndex']);
Route::get('/public/courts', [CourtController::class, 'publicIndex']);

Route::group(['middleware' => ['auth:sanctum', 'role:admin']], function () {
    // admin
    Route::get('admin/dashboard_bookings', [DashboardController::class, 'index']);
    Route::post('admin/dashboard_bookings', [DashboardController::class, 'store']);
    Route::get('admin/dashboard_bookingsSlot', [DashboardController::class, 'show']);
    Route::put('admin/dashboard_bookings/{bookingSlot}', [DashboardController::class, 'update']);

    // Route::get('admin/bookingSlot', [BookingController::class, 'index']);
    // Route::get('admin/bookingSlot/{bookingSlot}', [BookingController::class, 'show']);
    // Route::get('admin/bookingSlot/update/{id}', [BookingController::class, 'update']);

    Route::apiResource('admin/booking', BookingController::class);

    Route::apiResource('admin/courts', CourtController::class);

    Route::apiResource('admin/pricings', PricingController::class);
});
