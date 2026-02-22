"use client";

import React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  UserX,
  UserCheck,
  Users,
  Loader2,
} from "lucide-react";
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
} from "@/app/actions/users";
import type { User } from "@/types/models";
import type { CreateUserDTO, UpdateUserDTO } from "@/types/dto";

interface UsersManagementProps {
  initialUsers: User[];
}

export function UsersManagement({ initialUsers }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (data: CreateUserDTO) => {
    setIsSubmitting(true);
    const result = await createUserAction(data);
    if (result.success) {
      const newUser: User = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
      setIsCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (id: number, data: UpdateUserDTO) => {
    setIsSubmitting(true);
    const result = await updateUserAction(id, data);
    if (result.success) {
      setUsers(
        users.map((u) =>
          u.id === id
            ? { ...u, name: data.name!, email: data.email!, role: data.role! }
            : u,
        ),
      );
      setEditUser(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (id: number) => {
    const result = await toggleUserStatusAction(id);
    if (result.success) {
      setUsers(
        users.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">
                No hay usuarios
              </p>
              <p className="text-sm text-muted-foreground">
                Agrega usuarios para comenzar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Usuario
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Correo
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      Rol
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role === "admin" ? "Administrador" : "Cajero"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                          className={
                            user.is_active
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm
              initialData={editUser}
              onSubmit={(data) =>
                handleUpdate(editUser.id, data as UpdateUserDTO)
              }
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: CreateUserDTO | UpdateUserDTO) => void;
  isSubmitting: boolean;
}

function UserForm({ initialData, onSubmit, isSubmitting }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || "cashier",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialData) {
      // Update - password is optional
      const updateData: UpdateUserDTO = {
        name: formData.name,
        email: formData.email,
        role: formData.role as "admin" | "cashier",
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      onSubmit(updateData);
    } else {
      // Create - password is required
      onSubmit({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as "admin" | "cashier",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          maxLength={150}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña {initialData && "(dejar vacío para mantener)"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required={!initialData}
          maxLength={16}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cashier">Cajero</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : initialData ? (
          "Actualizar Usuario"
        ) : (
          "Crear Usuario"
        )}
      </Button>
    </form>
  );
}
