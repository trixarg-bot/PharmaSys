import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido a PharmaSys
        </h1>
        <p className="text-muted-foreground">
          Sistema de gestión de farmacia para control de inventario, ventas y
          medicamentos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Medicamento</CardTitle>
            <CardDescription>
              Registra nuevos medicamentos en el sistema para mantener
              actualizado el inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/medicamentos">
              <Button className="w-full">Ir a Registro</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultar Inventario</CardTitle>
            <CardDescription>
              Visualiza todos los medicamentos disponibles con sus precios,
              cantidades y fechas de vencimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/inventario">
              <Button variant="outline" className="w-full">
                Ver Inventario
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Venta</CardTitle>
            <CardDescription>
              Realiza ventas de medicamentos y actualiza automáticamente el
              inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ventas">
              <Button variant="outline" className="w-full">
                Ir a Ventas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
