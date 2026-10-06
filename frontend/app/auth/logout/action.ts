"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Failed to revoke the logout token:", response.status);
      }
    } catch (error) {
      console.error("Could not reach the server to revoke the logout token:", error);
    }
  }

  cookieStore.delete("auth_token");
  cookieStore.delete("user_role");

  redirect("/auth/login");
}
