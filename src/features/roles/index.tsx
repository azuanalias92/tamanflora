import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAclStore } from "@/stores/acl-store";
import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Separator } from "@radix-ui/react-separator";
import { Main } from "@/components/layout/main";

const roleSchema = z.object({
  name: z.string().min(2, "Enter role name"),
  description: z.string().optional().catch(""),
});

type Crud = { create: boolean; read: boolean; update: boolean; delete: boolean };

function resourceList() {
  return ["/", "/roles", "/users", "/checkpoints", "/check-in", "/check-in-logs", "/directory", "/homestay", "/settings"];
}

export function Roles() {
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Crud>>({});
  const acl = useAclStore();

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/roles");
      const list = await res.json();
      setRoles(list);
      if (list.length > 0 && !selectedRole) {
        setSelectedRole({ id: list[0].id, name: list[0].name });
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    (async () => {
      const res = await fetch(`/api/roles/${selectedRole.id}`);
      const json = await res.json();
      const m: Record<string, Crud> = {};
      for (const r of resourceList()) {
        m[r] = { create: false, read: true, update: false, delete: false };
      }
      for (const p of json.permissions || []) {
        const r = String(p.resource);
        if (!m[r]) m[r] = { create: false, read: false, update: false, delete: false };
        m[r] = {
          create: Number(p.can_create || 0) === 1,
          read: Number(p.can_read || 0) === 1,
          update: Number(p.can_update || 0) === 1,
          delete: Number(p.can_delete || 0) === 1,
        };
      }
      setMatrix(m);
    })();
  }, [selectedRole?.id]);

  const resources = useMemo(() => resourceList(), []);

  async function onCreateRole(data: z.infer<typeof roleSchema>) {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to create role");
      return;
    }
    const role = await res.json();
    setRoles((r) => [...r, role]);
    setSelectedRole({ id: role.id, name: role.name });
    toast.success("Role created");
  }

  async function onSaveAcl() {
    if (!selectedRole) return;
    const payload = {
      role: selectedRole.name,
      permissions: Object.entries(matrix).map(([resource, p]) => ({
        resource,
        create: p.create,
        read: p.read,
        update: p.update,
        delete: p.delete,
      })),
    };
    const res = await fetch("/api/acl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Failed to save ACL");
      return;
    }
    if (acl.role === selectedRole.name) {
      await acl.loadForRole(selectedRole.name);
    }
    toast.success("ACL saved");
  }

  function toggle(resource: string, key: keyof Crud) {
    setMatrix((m) => ({ ...m, [resource]: { ...m[resource], [key]: !m[resource]?.[key] } }));
  }

  function tickAll() {
    setMatrix((m) => {
      const next: Record<string, Crud> = { ...m };
      for (const r of resources) {
        next[r] = { create: true, read: true, update: true, delete: true };
      }
      return next;
    });
  }

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Roles</h1>
          <p className="text-muted-foreground">Manage your roles and set permissions.</p>
        </div>
        <Separator className="my-4 lg:my-6" />
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>No roles yet. Create one on the right.</TableCell>
                        </TableRow>
                      ) : (
                        roles.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.description}</TableCell>
                            <TableCell>
                              <Button variant="outline" onClick={() => setSelectedRole({ id: r.id, name: r.name })}>
                                Edit ACL
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="w-[360px]">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateRole)} className="grid gap-3">
                      <FormField
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. manager" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="optional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Create Role</Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedRole && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ACL: {selectedRole.name}</CardTitle>
                  <Button variant="outline" onClick={tickAll}>
                    Tick All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Create</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead>Update</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((r) => (
                      <TableRow key={r}>
                        <TableCell>{r}</TableCell>
                        <TableCell>
                          <Checkbox checked={!!matrix[r]?.create} onCheckedChange={() => toggle(r, "create")} />
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={!!matrix[r]?.read} onCheckedChange={() => toggle(r, "read")} />
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={!!matrix[r]?.update} onCheckedChange={() => toggle(r, "update")} />
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={!!matrix[r]?.delete} onCheckedChange={() => toggle(r, "delete")} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button onClick={onSaveAcl}>Save ACL</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </>
  );
}
