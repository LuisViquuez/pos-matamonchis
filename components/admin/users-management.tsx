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
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
} from "@/app/actions/users";
import type { User } from "@/types/models";
import type { CreateUserDTO, UpdateUserDTO } from "@/types/dto";

type UpdateUserFormDTO = Omit<UpdateUserDTO, "id">;
const MAX_USER_FIELD_LENGTH = 30;

interface UsersManagementProps {
  initialUsers: User[];
  currentUserId: number;
}

export function UsersManagement({
  initialUsers,
  currentUserId,
}: UsersManagementProps) {
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
    const createdUser = result.user;
    if (result.success) {
      if (createdUser) {
        setUsers((current) => [...current, createdUser]);
      }
      setIsCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (id: number, data: UpdateUserFormDTO) => {
    setIsSubmitting(true);
    const result = await updateUserAction(id, data);
    const updatedUser = result.user;
    if (result.success) {
      if (updatedUser) {
        setUsers((current) =>
          current.map((user) => (user.id === id ? updatedUser : user)),
        );
      }
      setEditUser(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (id: number) => {
    if (id === currentUserId) {
      return;
    }

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
            <UserForm
              onSubmit={(data) => handleCreate(data as CreateUserDTO)}
              isSubmitting={isSubmitting}
            />
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
                            disabled={user.id === currentUserId}
                            title={
                              user.id === currentUserId
                                ? "No puedes cambiar tu propio estado"
                                : undefined
                            }
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
                handleUpdate(editUser.id, data as UpdateUserFormDTO)
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
  onSubmit: (data: CreateUserDTO | UpdateUserFormDTO) => void;
  isSubmitting: boolean;
}

function UserForm({ initialData, onSubmit, isSubmitting }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || "cashier",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialData) {
      // Update - password is optional
      const updateData: UpdateUserFormDTO = {
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
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value.slice(0, MAX_USER_FIELD_LENGTH),
            })
          }
          maxLength={MAX_USER_FIELD_LENGTH}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value.slice(0, MAX_USER_FIELD_LENGTH),
            })
          }
          required
          maxLength={MAX_USER_FIELD_LENGTH}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña {initialData && "(dejar vacío para mantener)"}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value.slice(0, MAX_USER_FIELD_LENGTH),
              })
            }
            required={!initialData}
            maxLength={MAX_USER_FIELD_LENGTH}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value) =>
            setFormData({ ...formData, role: value as "admin" | "cashier" })
          }
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
