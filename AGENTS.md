# AGENTS.md

## Project Overview
Aplicación de escritorio SaaS para gestión empresarial (inventario, POS, contabilidad, nómina). Plataforma objetivo: Windows. En fase de planificación — los directorios de código están vacíos.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js + Tailwind CSS
- **Base de datos**: SQLite (archivo único, almacenado en `%AppData%`)
- **Empaquetado**: PyInstaller (backend EXE) + Inno Setup (instalador)
- **Contenedor desktop**: PyWebView (integra el frontend sin navegador externo)

## Estructura de Directorios (planificada)
```
backend/app/
  core/         # Config, seguridad, validación de licencias, conexión DB
  models/       # Definiciones de tablas SQLAlchemy
  schemas/      # Modelos de validación Pydantic
  services/     # Lógica de negocio (costos, impuestos, inventario, ventas)
  api/          # Rutas por dominio (v1_inventory, v1_sales, etc.)
  main.py       # Entry point de FastAPI

frontend/
  components/   # UI reutilizable (tablas, modales, gráficos)
  hooks/        # Lógica de peticiones a la API
  pages/        # Vistas (Dashboard, POS, Inventario)

database/       # Archivo SQLite (runtime)
packaging/      # Scripts de Inno Setup, specs de PyInstaller
docs/           # Documentación
launcher.py     # Script para iniciar backend + frontend juntos
```

## Reglas Arquitectónicas Clave
- **Patrón de servicios**: Nunca poner lógica de negocio en rutas de la API. Usar servicios (ej: `SalesService` llama a `InventoryService` para descontar stock, `AccountingService` para registrar ingresos).
- **Middleware de licencia**: Todas las rutas de la API (excepto `/api/activate`) deben pasar por validación de licencia.
- **Control de módulos**: Las funcionalidades se habilitan/deshabilitan mediante flags en config encriptada (`has_pos_license`, `has_hr_license`, etc.).
- **Offline-first**: Sin servidores externos. La validación de licencia usa HWID (ID de hardware del motherboard).

## Requisitos del Sistema de Licencias
- Trial de 30 días desde la fecha de instalación
- Activación ligada al HWID (la clave solo funciona en una máquina)
- Archivo de config encriptado almacenado en `%AppData%`
- Trial expirado → 403 en todas las rutas excepto el endpoint de activación
- El frontend muestra pantalla de bloqueo con datos de contacto al recibir 403

## Módulos de BD (normalizados)
- **Core**: Empresa, Usuarios, Licencia
- **Inventario**: Productos, Categorías, AjustesStock, Kardex (historial de movimientos)
- **Ventas**: Facturas, DetalleFactura, Clientes, MétodosPago
- **Contable**: CuentasPorPagar, GastosFijos, AsientosContables
- **RRHH**: Empleados, Asistencia, RecibosNómina

## Convenciones
- FastAPI genera auto-docs en `/docs` — mantener los schemas limpios para consumidores de la API
- Reportes PDF usan plantillas Jinja2 + HTML/Tailwind (sin layouts hardcodeados)
- Backup de SQLite al cerrar la app (exportar `.db` a carpeta separada)
- Python: seguir PEP 8; Frontend: seguir convenciones de Next.js


## Key Files
- `launcher.py` - Entry point that starts backend + frontend together
- `backend/app/main.py` - FastAPI entry point
- `opencode.json` - MCP Stitch config for UI generation
