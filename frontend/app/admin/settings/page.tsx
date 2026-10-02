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

  const [settings, setSettings] = useState<any>({
    storeName: "",
    openTime: "08:00",
    closeTime: "22:00",
    advanceDays: 30,
    cancelWindow: 24,
    timezone: "utc8",
    users: [],
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPendingUpdateUser, startTransitionUpdateUser] = useTransition();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
    startTransitionHours(async () => {
      const result = await updateHoursSettings(settings);
      if (result.success) {
        alert(result.message);
      } else {
        alert("Failed to save: " + result.message);
      }
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    
    startTransitionUser(async () => {
      const result = await updatePassword(passwords);
      if (result.success) {
        alert(result.message);
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert("Failed to update: " + result.message);
      }
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveUserUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    startTransitionUpdateUser(async () => {
      const result = await updateUser(editingUser);
      if (result.success) {
        alert(result.message);
        setIsEditDialogOpen(false);
        setEditingUser(null);
        // refresh settings
        const data = await getSettings();
        if (data) {
          setSettings(data);
        }
      } else {
        alert("Failed to update user: " + result.message);
      }
    });
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/20">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your booking rules, operating hours, and administrator accounts.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Operating Hours & Booking Rules */}
          <Card>
            <form onSubmit={handleSaveHours}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="w-5 h-5 text-primary" />
                  Operating Hours & Booking Rules
                </CardTitle>
                <CardDescription>
                  Configure global operating hours, advance booking limits, and cancellation windows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={settings.storeName} onChange={(e) => setSettings({...settings, storeName: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Opening Time</Label>
                    <Input id="openTime" type="time" value={settings.openTime} onChange={(e) => setSettings({...settings, openTime: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Closing Time</Label>
                    <Input id="closeTime" type="time" value={settings.closeTime} onChange={(e) => setSettings({...settings, closeTime: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advanceDays">Advance Booking Limit (Days)</Label>
                    <Input id="advanceDays" type="number" value={settings.advanceDays} onChange={(e) => setSettings({...settings, advanceDays: Number(e.target.value)})} min={1} max={365} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancelWindow">Cancellation Window (Hours before start)</Label>
                    <Input id="cancelWindow" type="number" value={settings.cancelWindow} onChange={(e) => setSettings({...settings, cancelWindow: Number(e.target.value)})} min={0} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(val) => setSettings({...settings, timezone: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc8">UTC+08:00 (Asia/Manila)</SelectItem>
                      <SelectItem value="utc0">UTC+00:00 (GMT)</SelectItem>
                      <SelectItem value="utc-5">UTC-05:00 (Eastern Time)</SelectItem>
                      <SelectItem value="utc-8">UTC-08:00 (Pacific Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button type="submit" disabled={isPendingHours} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isPendingHours ? "Saving..." : "Save Rules"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* User / Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-primary" />
                User & Role Management
              </CardTitle>
              <CardDescription>
                Manage administrator accounts and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Current Administrators</h3>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Invite Admin
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.users?.length > 0 ? (
                        settings.users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" /> Change Your Password
                </h3>
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPendingUser} className="gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      {isPendingUser ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveUserUpdate}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update the user's details and role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser?.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser?.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editingUser?.role || "user"}
                  onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPendingUpdateUser}>
                {isPendingUpdateUser ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
