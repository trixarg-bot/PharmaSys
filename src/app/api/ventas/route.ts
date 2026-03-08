import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT v.*, 
        json_agg(
          json_build_object(
            'id', vd.id,
            'medicamento_id', vd.medicamento_id,
            'cantidad', vd.cantidad,
            'precio_unitario', vd.precio_unitario,
            'subtotal', vd.subtotal,
            'medicamento_nombre', m.nombre
          )
        ) as detalles
      FROM ventas v
      LEFT JOIN venta_detalles vd ON v.id = vd.venta_id
      LEFT JOIN medicamentos m ON vd.medicamento_id = m.id
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener las ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar al menos un medicamento" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    for (const item of items) {
      const stock = await client.query(
        "SELECT cantidad, nombre FROM medicamentos WHERE id = $1",
        [item.medicamento_id]
      );

      if (stock.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `Medicamento con ID ${item.medicamento_id} no encontrado` },
          { status: 404 }
        );
      }

      if (stock.rows[0].cantidad < item.cantidad) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${stock.rows[0].nombre}". Disponible: ${stock.rows[0].cantidad}`,
          },
          { status: 400 }
        );
      }
    }

    const total = items.reduce(
      (sum: number, item: { precio_unitario: number; cantidad: number }) =>
        sum + item.precio_unitario * item.cantidad,
      0
    );

    const ventaResult = await client.query(
      "INSERT INTO ventas (total) VALUES ($1) RETURNING *",
      [total]
    );
    const ventaId = ventaResult.rows[0].id;

    for (const item of items) {
      const subtotal = item.precio_unitario * item.cantidad;

      await client.query(
        `INSERT INTO venta_detalles (venta_id, medicamento_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, item.medicamento_id, item.cantidad, item.precio_unitario, subtotal]
      );

      await client.query(
        "UPDATE medicamentos SET cantidad = cantidad - $1 WHERE id = $2",
        [item.cantidad, item.medicamento_id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Venta realizada correctamente", venta: ventaResult.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar venta:", error);
    return NextResponse.json(
      { error: "Error al registrar la venta" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
