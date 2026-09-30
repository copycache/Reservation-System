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

        $users = \App\Models\User::with('roles')->get()->map(function($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->roles->first()->name ?? 'user'
            ];
        });

        return response()->json([
            'openTime' => $settings['openTime'] ?? '08:00',
            'closeTime' => $settings['closeTime'] ?? '24:00',
            'advanceDays' => isset($settings['advanceDays']) ? (int)$settings['advanceDays'] : 30,
            'cancelWindow' => isset($settings['cancelWindow']) ? (int)$settings['cancelWindow'] : 24,
            'timezone' => $settings['timezone'] ?? 'utc8',
            'users' => $users,
        ]);
    }

     public function store(Request $request){

        $type = $request->input('type');

        if($type === 'hours') {
            $data = $request->only(['openTime', 'closeTime', 'advanceDays','cancelWindow','timezone']);

            foreach ($data as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]

                );
            
            }
            return response()->json(['success' => true]);
        }

        if ($type === 'password') {
            $request->validate([
                'currentPassword' => 'required',
                'newPassword' => 'required|min:8',
                'confirmPassword' => 'same:newPassword'
            ]);

            $user = $request->user();

            if (!Hash::check($request->currentPassword, $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }

            $user->password = Hash::make($request->newPassword);
            $user->save();

            return response()->json(['success' => true]);
        }

        if ($type === 'user') {
            $request->validate([
                'id' => 'required|exists:users,id',
                'name' => 'required|string',
                'email' => 'required|email',
                'role' => 'required|in:admin,user',
            ]);

            $userToUpdate = \App\Models\User::findOrFail($request->id);
            $userToUpdate->name = $request->name;
            $userToUpdate->email = $request->email;
            $userToUpdate->save();

            $userToUpdate->syncRoles([$request->role]);

            return response()->json(['success' => true]);
        }

        return response()->json(['message' => 'Invalid type'], 400);
    }
}

