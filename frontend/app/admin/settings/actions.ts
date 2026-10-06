"use server";

import { cookies } from "next/headers";

const API_URL = "http://127.0.0.1:8000/api";
const API_BASE = `${API_URL}/admin`;

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${API_URL}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user.");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getSettings() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch settings.");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

export async function updateHoursSettings(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  formData.append('type','hours')

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      return { success: false, message: "Failed to update hours settings." };
    }

    return { success: true, message: "Hours settings updated successfully." };
  } catch (error) {
    console.error("Error updating hours settings:", error);
    return { success: false, message: "An error occurred while saving." };
  }
}

export async function updatePassword(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'password', ...data }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, message: errorData.message || "Failed to update password." };
    }

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: "An error occurred while saving." };
  }
}

export async function updateUser(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'user', ...data }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, message: errorData.message || "Failed to update user." };
    }

    return { success: true, message: "User updated successfully." };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "An error occurred while saving." };
  }
}
