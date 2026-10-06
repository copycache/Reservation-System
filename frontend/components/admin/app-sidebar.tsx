"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
import { ChevronsUpDown, User, GalleryVerticalEnd, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { getSettings } from "@/app/admin/settings/actions";
import { logoutAction } from "@/app/auth/logout/action";
import { PascalCase } from "@/lib/word_case";

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
        url: "/admin/revenue-report",
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

export function AppSidebar({ initialUser }: { initialUser: any | null }) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const [storeName, setStoreName] = useState("Reservation System");
  const [storeLogo, setStoreLogo] = useState("");
  const [user, setUser] = useState<any | null>(initialUser);

  const [openMenus, setOpenMenus] = useState({
    Reports: true,
  });

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.storeName) {
        setStoreName(settings.storeName);
      }
      if (settings?.StoreLogo) {
        setStoreLogo(settings.StoreLogo);
      }
    });
  }, []);

  function toggleMenu(name: string) {
    setOpenMenus((menus) => ({
      ...menus,
      [name]: !menus[name as keyof typeof menus],
    }));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                {storeLogo ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={storeLogo}
                      alt="Logo"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{storeName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {/* Enterprise */}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>

              {/* <DropdownMenuContent>
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
              </DropdownMenuContent> */}
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-blue-600 text-white">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {PascalCase(user.name)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent side={isMobile ? "bottom" : "right"}>
                <div className="flex items-center gap-3 p-1">
                  <div className="size-8 shrink-0 overflow-hidden rounded-full">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center rounded-full bg-blue-600">
                        <User className="size-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 leading-tight opacity-75">
                    <div className="truncate text-sm font-semibold">
                      {PascalCase(user.name)}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>

                <Separator className="my-1" />

                <form action={logoutAction} className="w-full">
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <LogOut />
                    <span>Log out</span>
                  </Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
