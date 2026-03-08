import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query("SELECT * FROM medicamentos WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Medicamento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener medicamento:", error);
    return NextResponse.json(
      { error: "Error al obtener el medicamento" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, precio, cantidad, fecha_vencimiento } = body;

    if (!nombre || precio === undefined || cantidad === undefined || !fecha_vencimiento) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE medicamentos 
       SET nombre = $1, descripcion = $2, precio = $3, cantidad = $4, fecha_vencimiento = $5
       WHERE id = $6
       RETURNING *`,
      [nombre, descripcion || "", precio, cantidad, fecha_vencimiento, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Medicamento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar medicamento:", error);
    return NextResponse.json(
      { error: "Error al actualizar el medicamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "DELETE FROM medicamentos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Medicamento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Medicamento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar medicamento:", error);
    return NextResponse.json(
      { error: "Error al eliminar el medicamento" },
      { status: 500 }
    );
  }
}
