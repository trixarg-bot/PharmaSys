"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Venta } from "@/types";

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null
  );

  const cargarVentas = useCallback(async () => {
    try {
      const response = await fetch("/api/ventas");
      if (!response.ok) throw new Error("Error al cargar");
      const data = await response.json();
      setVentas(data);
    } catch {
      toast.error("Error al cargar el historial de ventas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const formatearPrecio = (precio: number) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(precio);

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalGeneral = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const cantidadVentas = ventas.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Historial de Ventas
        </h1>
        <p className="text-muted-foreground">
          Resumen de todas las ventas realizadas en el sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cantidadVentas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearPrecio(totalGeneral)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio por Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {cantidadVentas > 0
                ? formatearPrecio(totalGeneral / cantidadVentas)
                : formatearPrecio(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Cargando ventas...</p>
        </div>
      ) : ventas.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">
            No se han registrado ventas aún.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Productos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell>
                    <Badge variant="secondary">#{venta.id}</Badge>
                  </TableCell>
                  <TableCell>{formatearFecha(venta.fecha)}</TableCell>
                  <TableCell className="text-center">
                    {venta.detalles?.length || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatearPrecio(Number(venta.total))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVentaSeleccionada(venta)}
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!ventaSeleccionada}
        onOpenChange={() => setVentaSeleccionada(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Detalle de Venta #{ventaSeleccionada?.id}
            </DialogTitle>
            <DialogDescription>
              {ventaSeleccionada && formatearFecha(ventaSeleccionada.fecha)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">P. Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventaSeleccionada?.detalles?.map((detalle, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {detalle.medicamento_nombre}
                      </TableCell>
                      <TableCell className="text-center">
                        {detalle.cantidad}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(Number(detalle.precio_unitario))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(Number(detalle.subtotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {ventaSeleccionada &&
                  formatearPrecio(Number(ventaSeleccionada.total))}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
