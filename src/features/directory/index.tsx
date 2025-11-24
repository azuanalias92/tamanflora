import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { TasksProvider } from "./components/tasks-provider";
import { TasksTable } from "./components/tasks-table";

export function Tasks() {
  return (
    <TasksProvider>
      <Header fixed>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Neighborhood Directory</h2>
            <p className="text-muted-foreground">Browse residents by house number, owners, and vehicles.</p>
          </div>
        </div>
        <TasksTable />
      </Main>
    </TasksProvider>
  );
}
