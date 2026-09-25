"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  ChevronDown,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  CalendarDays,
  Wallet,
  Tags,
  FileChartLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type Tab = {
  title: string;
  url?: string;
  icon: LucideIcon;
  children?: {
    title: string;
    url: string;
    icon: LucideIcon | null;
  }[];
};

const tabs: Tab[] = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calendar",
    url: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    title: "Bookings",
    url: "/admin/bookings",
    icon: Users,
  },
  {
    title: "Courts",
    url: "/admin/courts",
    icon: Wallet,
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: Wallet,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: Users,
  },
  {
    title: "Pricing",
    url: "/admin/pricing",
    icon: Tags,
  },
  {
    title: "Reports",
    icon: FileChartLine,
    children: [
      {
        title: "Revenue",
        url: "/admin/revenue",
        icon: null,
      },
      {
        title: "Booking Report",
        url: "/admin/booking-report",
        icon: null,
      },
      {
        title: "Customer Report",
        url: "/admin/customer-report",
        icon: null,
      },
    ],
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState({
    Reports: true,
  });

  function toggleMenu(name: string) {
    setOpenMenus((menus) => ({
      ...menus,
      [name]: !menus[name as keyof typeof menus],
    }));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map((item) => {
                const childIsActive = item.children?.some(
                  (child) => pathname === child.url,
                );
                const itemIsActive = item.url === pathname;
                const menuIsOpen =
                  childIsActive ||
                  openMenus[item.title as keyof typeof openMenus];

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.children ? (
                      <Collapsible
                        open={menuIsOpen}
                        onOpenChange={() => {
                          if (childIsActive) {
                            return;
                          }

                          toggleMenu(item.title);
                        }}
                      >
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton>
                              <item.icon className="h-4 w-4" />

                              <span className="flex-1">{item.title}</span>

                              <ChevronDown
                                className={`h-4 w-4 ${
                                  menuIsOpen ? "rotate-180" : ""
                                }`}
                              />
                            </SidebarMenuButton>
                          }
                        />

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;

                              return (
                                <SidebarMenuSubItem key={child.url}>
                                <SidebarMenuSubButton
                                  isActive={pathname === child.url}
                                  render={
                                    <Link
                                      href={child.url}
                                      className="flex items-center gap-2"
                                    >
                                      {ChildIcon ? (
                                        <ChildIcon className="h-4 w-4" />
                                      ) : null}
                                      <span>{child.title}</span>
                                    </Link>
                                  }
                                />
                              </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton
                        isActive={itemIsActive}
                        render={
                          <Link
                            href={item.url!}
                            className="flex items-center gap-2"
                          >
                            <item.icon className="h-4 w-4" />

                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
