"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Medicamento, ItemCarrito } from "@/types";

export default function VentasPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState("");
  const [cantidadInput, setCantidadInput] = useState("1");
  const [loading, setLoading] = useState(false);
  const [cargandoMeds, setCargandoMeds] = useState(true);

  const cargarMedicamentos = useCallback(async () => {
    try {
      const response = await fetch("/api/medicamentos");
      if (!response.ok) throw new Error("Error al cargar");
      const data = await response.json();
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      setMedicamentos(
        data.filter(
          (m: Medicamento) =>
            m.cantidad > 0 && new Date(m.fecha_vencimiento) > hoy
        )
      );
    } catch {
      toast.error("Error al cargar medicamentos");
    } finally {
      setCargandoMeds(false);
    }
  }, []);

  useEffect(() => {
    cargarMedicamentos();
  }, [cargarMedicamentos]);

  const agregarAlCarrito = () => {
    if (!medicamentoSeleccionado) {
      toast.error("Selecciona un medicamento");
      return;
    }

    const cantidad = parseInt(cantidadInput);
    if (!cantidad || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    const med = medicamentos.find(
      (m) => m.id === parseInt(medicamentoSeleccionado)
    );
    if (!med) return;

    const existente = carrito.find(
      (item) => item.medicamento_id === med.id
    );
    const cantidadTotal = existente
      ? existente.cantidad + cantidad
      : cantidad;

    if (cantidadTotal > med.cantidad) {
      toast.error(
        `Stock insuficiente. Disponible: ${med.cantidad - (existente?.cantidad || 0)}`
      );
      return;
    }

    if (existente) {
      setCarrito(
        carrito.map((item) =>
          item.medicamento_id === med.id
            ? {
                ...item,
                cantidad: cantidadTotal,
                subtotal: cantidadTotal * med.precio,
              }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          medicamento_id: med.id,
          nombre: med.nombre,
          precio: med.precio,
          cantidad,
          stock_disponible: med.cantidad,
          subtotal: cantidad * med.precio,
        },
      ]);
    }

    setMedicamentoSeleccionado("");
    setCantidadInput("1");
    toast.success(`${med.nombre} agregado al carrito`);
  };

  const eliminarDelCarrito = (medicamento_id: number) => {
    setCarrito(carrito.filter((item) => item.medicamento_id !== medicamento_id));
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const formatearPrecio = (precio: number) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(precio);

  const realizarVenta = async () => {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map((item) => ({
            medicamento_id: item.medicamento_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error en la venta");
      }

      toast.success("Venta realizada correctamente");
      setCarrito([]);
      cargarMedicamentos();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar la venta"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Registrar Venta</h1>
        <p className="text-muted-foreground">
          Selecciona los medicamentos y registra la venta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Medicamento</CardTitle>
              <CardDescription>
                Selecciona un medicamento y la cantidad a vender.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Medicamento</Label>
                  <Select
                    value={medicamentoSeleccionado}
                    onValueChange={(v) => setMedicamentoSeleccionado(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          cargandoMeds
                            ? "Cargando..."
                            : "Selecciona un medicamento"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {medicamentos.map((med) => (
                        <SelectItem key={med.id} value={String(med.id)}>
                          {med.nombre} — {formatearPrecio(med.precio)} (Stock:{" "}
                          {med.cantidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-28 space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(e.target.value)}
                  />
                </div>
                <Button onClick={agregarAlCarrito} className="shrink-0">
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {carrito.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrito.map((item) => (
                    <TableRow key={item.medicamento_id}>
                      <TableCell className="font-medium">
                        {item.nombre}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(item.precio)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.cantidad}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(item.subtotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            eliminarDelCarrito(item.medicamento_id)
                          }
                        >
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumen de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {carrito.map((item) => (
                  <div
                    key={item.medicamento_id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span>{formatearPrecio(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {carrito.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatearPrecio(total)}</span>
                  </div>
                </>
              )}

              {carrito.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No hay productos en el carrito
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={realizarVenta}
                disabled={carrito.length === 0 || loading}
              >
                {loading ? "Procesando..." : "Realizar Venta"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
