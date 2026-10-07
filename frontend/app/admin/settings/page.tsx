"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, Save, ShieldAlert, Key, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSettings, updateHoursSettings, updatePassword, updateUser } from "./actions";

export default function SettingsPage() {
  const [isPendingHours, startTransitionHours] = useTransition();
  const [isPendingUser, startTransitionUser] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [settings, setSettings] = useState<any>({
    storeName: "",
    GcashNumber: "",
    GcashName: "",
    StoreLogo: ""
  });

  useEffect(() => {
    async function loadSettings() {
      const data = await getSettings();
      if (data) {
        setSettings(data);
      }
    }
    loadSettings();
  }, []);

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData()
    formData.append('storeName', settings.storeName)
    formData.append('GcashNumber', settings.GcashNumber)
    formData.append('GcashName', settings.GcashName)

    if (selectedFile) {
      formData.append('StoreLogo', selectedFile)
    }
    startTransitionHours(async () => {
      const result = await updateHoursSettings(formData);
      if (result.success) {
        window.location.reload();
      }
    });
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your booking rules, operating hours, and administrator accounts.
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSaveHours} className="space-y-6">
            {/* Operating Hours & Booking Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="w-5 h-5 text-primary" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={settings.storeName} onChange={(e) => setSettings({...settings, storeName: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label htmlFor="GcashNumber">Gcash Number</Label>
                    <Input id="GcashNumber" value={settings.GcashNumber} onChange={(e) => setSettings({...settings, GcashNumber: e.target.value})} />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="GcashName">Gcash Name</Label>
                    <Input id="GcashName" value={settings.GcashName} onChange={(e) => setSettings({...settings, GcashName: e.target.value})} />
                  </div>
                </div>
                
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Store Logo</CardTitle>
                <CardDescription>
                  Upload a logo to be displayed on the website and in the browser tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="space-y-4">
                  <Label htmlFor="StoreLogo">Select Image</Label>
                  <Input 
                    id="StoreLogo" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  />
                  {settings.StoreLogo && !selectedFile && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Current Logo:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.StoreLogo} alt="Store Logo" className="w-24 h-24 object-cover rounded-lg border bg-white" />
                    </div>
                  )}
                  {selectedFile && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected file: {selectedFile.name}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button type="submit" disabled={isPendingHours} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isPendingHours ? "Saving..." : "Save All Settings"}
                </Button>
              </CardFooter>
            </Card>
          </form>

        </div>
      </div>
    </main>
  );
}
