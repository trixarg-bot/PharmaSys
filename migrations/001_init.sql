-- ============================================
-- PharmaSys - Migración Inicial
-- Sistema de Gestión de Farmacia
-- Base de datos: PostgreSQL
-- ============================================

-- Tabla de medicamentos
-- Almacena todos los productos/medicamentos del inventario
CREATE TABLE IF NOT EXISTS medicamentos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    precio          DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    cantidad        INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    fecha_vencimiento DATE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ventas
-- Registra cada transacción de venta realizada
CREATE TABLE IF NOT EXISTS ventas (
    id              SERIAL PRIMARY KEY,
    total           DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    fecha           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalle de ventas
-- Almacena los medicamentos incluidos en cada venta
CREATE TABLE IF NOT EXISTS venta_detalles (
    id              SERIAL PRIMARY KEY,
    venta_id        INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    medicamento_id  INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE RESTRICT,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_medicamentos_nombre ON medicamentos(nombre);
CREATE INDEX IF NOT EXISTS idx_medicamentos_fecha_vencimiento ON medicamentos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_venta_detalles_venta_id ON venta_detalles(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalles_medicamento_id ON venta_detalles(medicamento_id);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en medicamentos
CREATE TRIGGER trigger_medicamentos_updated_at
    BEFORE UPDATE ON medicamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
