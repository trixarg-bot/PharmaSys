"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Medicamento } from "@/types";

export default function InventarioPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [editando, setEditando] = useState<Medicamento | null>(null);
  const [formEdit, setFormEdit] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    fecha_vencimiento: "",
  });
  const [guardando, setGuardando] = useState(false);

  const cargarMedicamentos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("busqueda", busqueda);

      const response = await fetch(`/api/medicamentos?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar");

      const data = await response.json();
      setMedicamentos(data);
    } catch {
      toast.error("Error al cargar los medicamentos");
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargarMedicamentos();
  }, [cargarMedicamentos]);

  const abrirEditar = (med: Medicamento) => {
    setEditando(med);
    setFormEdit({
      nombre: med.nombre,
      descripcion: med.descripcion || "",
      precio: String(med.precio),
      cantidad: String(med.cantidad),
      fecha_vencimiento: med.fecha_vencimiento.split("T")[0],
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);

    try {
      const response = await fetch(`/api/medicamentos/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formEdit.nombre.trim(),
          descripcion: formEdit.descripcion.trim(),
          precio: parseFloat(formEdit.precio),
          cantidad: parseInt(formEdit.cantidad),
          fecha_vencimiento: formEdit.fecha_vencimiento,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar");
      }

      toast.success("Medicamento actualizado correctamente");
      setEditando(null);
      cargarMedicamentos();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar"
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este medicamento?")) return;

    try {
      const response = await fetch(`/api/medicamentos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast.success("Medicamento eliminado correctamente");
      cargarMedicamentos();
    } catch {
      toast.error("Error al eliminar el medicamento");
    }
  };

  const obtenerEstadoVencimiento = (fecha: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diasRestantes = Math.ceil(
      (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasRestantes < 0) return { label: "Vencido", variant: "destructive" as const };
    if (diasRestantes <= 30) return { label: "Por vencer", variant: "secondary" as const };
    return { label: "Vigente", variant: "default" as const };
  };

  const medicamentosFiltrados = medicamentos.filter((med) => {
    if (filtro === "vencidos") {
      return new Date(med.fecha_vencimiento) < new Date();
    }
    if (filtro === "por_vencer") {
      const diff =
        (new Date(med.fecha_vencimiento).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }
    if (filtro === "sin_stock") {
      return med.cantidad === 0;
    }
    return true;
  });

  const formatearPrecio = (precio: number) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(precio);

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-DO");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">
          Lista de medicamentos disponibles en el sistema.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Buscar medicamento por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={filtro} onValueChange={(v) => setFiltro(v ?? "todos")}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="por_vencer">Por vencer (30 días)</SelectItem>
            <SelectItem value="sin_stock">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Cargando medicamentos...</p>
        </div>
      ) : medicamentosFiltrados.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">
            No se encontraron medicamentos.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead>Fecha de Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicamentosFiltrados.map((med) => {
                const estado = obtenerEstadoVencimiento(
                  med.fecha_vencimiento
                );
                return (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.nombre}</TableCell>
                    <TableCell className="text-right">
                      {formatearPrecio(med.precio)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          med.cantidad === 0 ? "destructive" : "default"
                        }
                      >
                        {med.cantidad}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatearFecha(med.fecha_vencimiento)}</TableCell>
                    <TableCell>
                      <Badge variant={estado.variant}>{estado.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditar(med)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => eliminar(med.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Medicamento</DialogTitle>
            <DialogDescription>
              Modifica los datos del medicamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={formEdit.nombre}
                onChange={(e) =>
                  setFormEdit({ ...formEdit, nombre: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Input
                id="edit-descripcion"
                value={formEdit.descripcion}
                onChange={(e) =>
                  setFormEdit({ ...formEdit, descripcion: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-precio">Precio *</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formEdit.precio}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, precio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cantidad">Cantidad *</Label>
                <Input
                  id="edit-cantidad"
                  type="number"
                  min="0"
                  step="1"
                  value={formEdit.cantidad}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, cantidad: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fecha">Fecha de Vencimiento *</Label>
              <Input
                id="edit-fecha"
                type="date"
                value={formEdit.fecha_vencimiento}
                onChange={(e) =>
                  setFormEdit({
                    ...formEdit,
                    fecha_vencimiento: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
