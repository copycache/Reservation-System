<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller {

    public function index(){
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        $logoUrl = '';
        if (!empty($settings['StoreLogo'])) {
            $logoUrl = url(Storage::url($settings['StoreLogo']));
        }

        return response()->json([
            'storeName' => $settings['storeName'] ?? '',
            'GcashNumber' => $settings['GcashNumber'] ?? '',
            'GcashName' => $settings['GcashName'] ?? '',
            'StoreLogo' => $logoUrl,
        ]);
    }

     public function store(Request $request){

        $type = $request->input('type');

        if($type === 'hours') {

            $data = $request->only(['storeName', 'GcashNumber', 'GcashName']);

            if ($request->hasFile('StoreLogo')) {
                $path = $request->file('StoreLogo')->store('settings_images', 'public');

                $oldPath = Setting::where('key', 'StoreLogo')->value('value');

                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }

                $data['StoreLogo'] = $path;
            }

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
