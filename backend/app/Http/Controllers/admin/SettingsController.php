<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller {

    public function index(){
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        return response()->json([
            'storeName' => $settings['storeName'] ?? '',
            'GcashNumber' => $settings['GcashNumber'] ?? '',
            'GcashName' => $settings['GcashName'] ?? '',
        ]);
    }

     public function store(Request $request){

        $type = $request->input('type');

        if($type === 'hours') {
            $data = $request->only(['storeName', 'GcashNumber', 'GcashName']);

            foreach ($data as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]

                );
            
            }
            return response()->json(['success' => true]);
        }

        return response()->json(['message' => 'Invalid type'], 400);
    }
}

