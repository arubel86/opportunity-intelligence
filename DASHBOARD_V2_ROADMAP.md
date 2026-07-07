# DASHBOARD_V2_ROADMAP.md
# Implementación Roadmap para el Dashboard V2 del Hermes Opportunity Intelligence Platform

## Visión General

El Dashboard V2 (HOIE - Geospatial Intelligence Center) es la evolución del panel de monitoreo de oportunidades, construido con un stack moderno: React 18, TypeScript, Vite, MapLibre GL, Zustand, SWR y Supabase. Este documento detalla el plan de implementación por fases, basado en el progreso actual y las próximas etapas definidas.

## Estado Actual (al momento de redacción)

- **Fases 0-4 completadas** según el historial del proyecto.
- Stack técnico funcionando en entorno de desarrollo con túnel localhost.run.
- Aplicación accesible en: `https://7ca33ec35bcc0c.lhr.life` (Vite dev :5173 + localhost.run).
- Versión V1 aún disponible en `localhost:8005` para referencia.
- Repositorio en `apps/dashboard-v2/` con 7 documentos de diseño (`DASHBOARD_V2_*.md`) y 18 pruebas unitarias/integración.
- Acción pendiente: `git rm node_modules` para limpiar el repositorio.

## Roadmap de Fases

### Fase 0: Fundación y Configuración (Completada)
**Objetivo:** Establecer el repositorio, configurar el entorno de desarrollo y definir las bases del proyecto.
- [x] Inicializar proyecto con Vite + React 18 + TypeScript.
- [x] Configurar ESLint, Prettier y Husky.
- [x] Integrar Supabase como backend (auth, base de datos, storage).
- [x] Configurar MapLibre GL para visualización geoespacial.
- [x] Definir estructura de carpetas y convenciones de código.
- [x] Crear documentos de diseño iniciales (DASHBOARD_V2_ARQUITECTURA.md, etc.).

### Fase 1: Arquitectura y Estructura Base (Completada)
**Objetivo:** Diseñar la arquitectura de la aplicación, establecer el estado global y las rutas principales.
- [x] Implementar Zustand para manejo de estado global.
- [x] Definir rutas principales con React Router v6.
- [x] Crear layout base (Header, Sidebar, Footer).
- [x] Configurar SWR para data fetching y caching.
- [x] Establecer módulos de autenticación con Supabase Auth.
- [x] Crear componentes UI reutilizativos (Botón, Input, Modal, etc.).

### Fase 2: Componentes UI Básicos y Conexión a Supabase (Completada)
**Objetivo:** Desarrollar los componentes esenciales y conectarlos a los datos de Supabase.
- [x] Construir tabla de oportunidades con paginación y ordenamiento.
- [x] Implementar formularios de creación/edición de oportunidades.
- [x] Conectar endpoints de Supabase (funciones edge o APIs REST).
- [x] Manejo de estados de carga, error y vacío.
- [x] Pruebas unitarias de componentes y hooks.
- [x] Documentar API de componentes en DASHBOARD_V2_COMPONENTES.md.

### Fase 3: Integración del Mapa Geoespacial (MapLibre) (Próxima)
**Objetivo:** Incorporar el mapa interactivo como centro del dashboard, mostrando oportunidades georreferenciadas.
- [ ] Configurar instancia de MapLibre GL dentro de un componente dedicado.
- [ ] Cargar y mostrar puntos de oportunidad desde Supabase (geolocalización lat/lng).
- [ ] Implementar clústeres de marcadores para grandes volúmenes de datos.
- [ ] Añadir popups interactivos con resumen de oportunidad al hacer clic.
- [ ] Filtrar puntos mostrados según filtros de la sidebar (tipo, estado, fecha).
- [ ] Sincronizar estado del mapa con el estado global de filtros.
- [ ] Pruebas de interacción y rendimiento del mapa.
- [ ] Actualizar documentación: DASHBOARD_V2_MAPA.md.

### Fase 4: Detalles de Oportunidades y Paneles de Información (Próxima)
**Objetivo:** Desarrollar vistas de detalle y paneles resumen para análisis profundo.
- [ ] Diseñar página de detalle de oportunidad (/oportunidad/:id).
- [ ] Mostrar información completa: descripción, métricas, historial, documentos adjuntos.
- [ ] Integrar gráficos de evolución (tiempo, volumen) usando una librería ligera (ej. Recharts o Chart.js).
- [ ] Crear panel lateral con acciones relacionadas (editar, duplicar, cambiar estado).
- [ ] Implementar vista de lista detallada con columnas configurables.
- [ ] Añadir funcionalidad de exportación a CSV/PDF para oportunidades filtradas.
- [ ] Pruebas de detalle y paneles.
- [ ] Documentar en DASHBOARD_V2_DETALLE.md.

### Fase 5: Funcionalidades Avanzadas (Próxima)
**Objetivo:** Añadir capacidades avanzadas que aumenten el valor analítico del dashboard.
- [ ] Filtros avanzados: rangos de fechas, búsqueda por texto, operadores lógicos.
- [ ] Guardado de vistas personalizadas (filtros + orden) por usuario.
- [ ] Sistema de alertas y notificaciones (en tiempo real mediante Supabase Realtime).
- [ ] Integración de capas geoespaciales adicionales (límites administrativos, calor mapas).
- [ ] Herramientas de medición y selección de áreas en el mapa.
- [ ] Modo oscuro/tema configurable.
- [ ] Optimización de rendimiento (lazy loading, memoización, virtual scrolling).
- [ ] Pruebas de carga y estrés con conjuntos de datos grandes.
- [ ] Documentar en DASHBOARD_V2_AVANZADO.md.

### Fase 6: Panel de Administración y Gestión de Usuarios (Próxima)
**Objetivo:** Proveer herramientas para administradores para gestionar el sistema y los usuarios.
- [ ] Vista de gestión de usuarios (listado, roles, estado).
- [ ] Creación/edición/eliminación de usuarios con control de acceso basado en roles (RBAC).
- [ ] Registro de auditoría de acciones críticas (quién creó/modificó qué).
- [ ] Configuración de parámetros del sistema (límites, integraciones externas).
- [ ] Gestión de permisos y grupos de acceso a funcionalidades.
- [ ] Reportes de uso y actividad (login, operaciones por usuario).
- [ ] Pruebas de flujo de administración y seguridad.
- [ ] Documentar en DASHBOARD_V2_ADMIN.md.

### Fase 7: Pulido, Optimización y Accesibilidad (Próxima)
**Objetivo:** Refinar la experiencia de usuario, asegurar calidad y accesibilidad.
- [ ] Revisión completa de UI/UX basada en guías de diseño y feedback de usuarios.
- [ ] Implementar accesibilidad WCAG 2.1 AA (navegación teclado, ARIA labels, contraste).
- [ ] Optimizar bundle size (code splitting, lazy loading de rutas pesadas).
- [ ] Mejorar tiempos de carga con caching inteligente y prefetching.
- [ ] Añadir pruebas end-to-end con Cypress o Playwright para flujos críticos.
- [ ] Realizar testing de compatibilidad cross-browser (Chrome, Firefox, Safari, Edge).
- [ ] Documentar guía de contribuyente y estándares de código.
- [ ] Preparar build de producción y checklist de despliegue.

### Fase 8: Migración de V1 a V2 y Despliegue Producción (Próxima)
**Objetivo:** Transicionar de la versión actual V1 a la nueva V2 en entorno de producción.
- [ ] Ejecutar `git rm node_modules` y limpiar historial de repositorio si es necesario.
- [ ] Taggear versión estable de V2 (ej. v2.0.0).
- [ ] Configurar pipeline de CI/CD (GitHub Actions) para build y despliegue.
- [ ] Desplegar en entorno de staging para validación final.
- [ ] Realizar migración de datos (si hay cambios de esquema) desde V1 a V2.
- [ ] Switch de DNS / balanceador de carga para apuntar a V2.
- [ ] Monitoreo de errores y rendimiento en producción (Sentry, Logtail).
- [ ] Capacitación a usuarios finales y entrega de documentación de usuario.
- [ ] Retrospective y plan de mejoras post-lanzamiento.

## Métricas de Éxito y Checklist de Finalización por Fase

Cada fase se considerará completada cuando se cumpla lo siguiente:
- Todos los issues y tareas asociados están cerrados.
- Código aprobado mediante pull request con revisiones de al menos un reviewer.
- Pruebas unitarias >= 80% de cobertura para los componentes nuevos/ modificados.
- Pruebas de integración/end-to-end pasan en entorno de CI.
- Documentación actualizada y almacenada en el repositorio.
- Demo interna realizada y feedback incorporado.

## Próximos Pasos Inmediatos

1. Limpiar repositorio: ejecutar `git rm -r --cached node_modules && git commit -m "chore: remove node_modules from tracking"`.
2. Iniciar trabajo en Fase 3: crear rama `feature/fase-3-mapa`.
3. Definir criterios de aceptación detallados para el componente de mapa en un issue de GitHub.
4. Programar reunión de revisión de diseño con el equipo de producto y UX.

## Anexos

- **Enlaces útiles**
  - Repositorio: `https://github.com/<org>/hermes/tree/main/apps/dashboard-v2`
  - Documentos de diseño: `apps/dashboard-v2/docs/DASHBOARD_V2_*.md`
  - Demo en desarrollo: `https://7ca33ec35bcc0c.lhr.life`
  - V1 local: `http://localhost:8005`

- **Glosario**
  - HOIE: Hermes Opportunity Intelligence Center (Geospatial Intelligence Center).
  - V2: Segunda generación del dashboard.
  - SWR: Biblioteca de React para data fetching y caching.
  - Zustand: Biblioteca ligera de manejo de estado global.
  - MapLibre GL: Fork abierto de Mapbox GL para mapas interactivos.

---
*Documento generado el $(date +%Y-%m-%d) como parte del proceso de planificación del Hermes Opportunity Intelligence Platform.*