import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const orden = searchParams.get("orden") || "nombre";
    const direccion = searchParams.get("direccion") || "asc";

    const columnas_validas = ["nombre", "precio", "cantidad", "fecha_vencimiento"];
    const orden_col = columnas_validas.includes(orden) ? orden : "nombre";
    const dir = direccion === "desc" ? "DESC" : "ASC";

    let query: string;
    let params: string[];

    if (busqueda) {
      query = `
        SELECT * FROM medicamentos 
        WHERE nombre ILIKE $1 OR descripcion ILIKE $1
        ORDER BY ${orden_col} ${dir}
      `;
      params = [`%${busqueda}%`];
    } else {
      query = `SELECT * FROM medicamentos ORDER BY ${orden_col} ${dir}`;
      params = [];
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener medicamentos:", error);
    return NextResponse.json(
      { error: "Error al obtener los medicamentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, cantidad, fecha_vencimiento } = body;

    if (!nombre || precio === undefined || cantidad === undefined || !fecha_vencimiento) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    if (precio < 0) {
      return NextResponse.json(
        { error: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    if (cantidad < 0 || !Number.isInteger(cantidad)) {
      return NextResponse.json(
        { error: "La cantidad debe ser un número entero positivo" },
        { status: 400 }
      );
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(fecha_vencimiento) <= hoy) {
      return NextResponse.json(
        { error: "La fecha de vencimiento debe ser una fecha futura" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO medicamentos (nombre, descripcion, precio, cantidad, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, descripcion || "", precio, cantidad, fecha_vencimiento]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear medicamento:", error);
    return NextResponse.json(
      { error: "Error al registrar el medicamento" },
      { status: 500 }
    );
  }
}
