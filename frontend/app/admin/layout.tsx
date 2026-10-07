import type { Metadata } from "next";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { getUser, getSettings } from "@/app/admin/settings/actions";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const storeName = settings?.storeName || "Reservation System";
  const storeLogo = settings?.StoreLogo;

  return {
    title: `${storeName} - Admin Dashboard`,
    description: "Admin dashboard",
    icons: {
      icon: storeLogo,
      apple: storeLogo,
    },
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const initialUser: any | null = await getUser();

  return (
    <SidebarProvider>
      <AppSidebar initialUser={initialUser} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger size="lg" />
          </div>
        </header>

        {children}
      </SidebarInset>
    </SidebarProvider>

    
  );
}
