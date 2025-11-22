import { LayoutDashboard, Settings, Users, Command, UserCog, Palette, Lock, CheckCircle, MapPin, Home } from "lucide-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Taman Flora Terapung",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
          requiredPermission: { resource: "/", action: "read" },
        },
        {
          title: "Directory",
          url: "/directory",
          icon: Users,
          requiredPermission: { resource: "/directory", action: "read" },
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
          requiredPermission: { resource: "/users", action: "read" },
        },
        {
          title: "Checkpoints",
          url: "/checkpoints",
          icon: MapPin,
          requiredPermission: { resource: "/checkpoints", action: "read" },
        },
        {
          title: "Homestay",
          url: "/homestay",
          icon: Home,
          requiredPermission: { resource: "/homestay", action: "read" },
        },
        {
          title: "Check In",
          icon: CheckCircle,
          items: [
            {
              title: "Check In",
              url: "/check-in",
              requiredPermission: { resource: "/check-in", action: "create" },
            },
            {
              title: "View Logs",
              url: "/check-in-logs",
              requiredPermission: { resource: "/check-in-logs", action: "read" },
            },
          ],
        },
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/settings",
              icon: UserCog,
              requiredPermission: { resource: "/settings", action: "read" },
            },
            {
              title: "Change Password",
              url: "/settings/change-password",
              icon: Lock,
              requiredPermission: { resource: "/settings", action: "read" },
            },
            {
              title: "Roles",
              url: "/roles",
              icon: Lock,
              requiredPermission: { resource: "/roles", action: "read" },
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: Palette,
              requiredPermission: { resource: "/settings", action: "read" },
            },
          ],
        },
      ],
    },
  ],
};
