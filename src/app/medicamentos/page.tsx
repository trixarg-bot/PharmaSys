"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function MedicamentosPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    fecha_vencimiento: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validarFormulario = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del medicamento es obligatorio");
      return false;
    }
    if (!form.precio || parseFloat(form.precio) < 0) {
      toast.error("El precio debe ser un valor válido");
      return false;
    }
    if (
      !form.cantidad ||
      parseInt(form.cantidad) < 0 ||
      !Number.isInteger(Number(form.cantidad))
    ) {
      toast.error("La cantidad debe ser un número entero válido");
      return false;
    }
    if (!form.fecha_vencimiento) {
      toast.error("La fecha de vencimiento es obligatoria");
      return false;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(form.fecha_vencimiento) <= hoy) {
      toast.error("La fecha de vencimiento debe ser una fecha futura");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/medicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio: parseFloat(form.precio),
          cantidad: parseInt(form.cantidad),
          fecha_vencimiento: form.fecha_vencimiento,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al registrar");
      }

      toast.success("Medicamento registrado correctamente");

      setForm({
        nombre: "",
        descripcion: "",
        precio: "",
        cantidad: "",
        fecha_vencimiento: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar el medicamento"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Registrar Medicamento
        </h1>
        <p className="text-muted-foreground">
          Completa el formulario para registrar un nuevo medicamento en el
          inventario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Medicamento</CardTitle>
          <CardDescription>
            Todos los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del medicamento *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Paracetamol 500mg"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Descripción del medicamento..."
                value={form.descripcion}
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (RD$) *</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.cantidad}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">
                Fecha de vencimiento *
              </Label>
              <Input
                id="fecha_vencimiento"
                name="fecha_vencimiento"
                type="date"
                value={form.fecha_vencimiento}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Medicamento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
