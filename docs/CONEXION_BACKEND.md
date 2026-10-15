# Conectar los servicios después del go

Estado actual: aplicación estática y persistencia local. Este documento define la continuidad; no hay backend, base de datos, proveedor elegido ni infraestructura contratada como parte de esta entrega.

## Puntos de conexión existentes

`src/model.ts` y `src/operations-model.ts` definen el estado validado. `src/domain.ts` y `src/operations.ts` contienen los comandos y reglas locales. `src/store.tsx` aplica los comandos y guarda en localStorage. `src/insights.ts` calcula indicadores. Las pantallas usan el store; no contienen claves de servicios.

Al conectar la API, conservar la interfaz de las pantallas y trasladar la autoridad al servidor. El store necesitará estados de carga, errores/reintentos y respuestas asíncronas. No basta con cambiar localStorage por una URL: identidad, transacciones y permisos deben implementarse y probarse en el servidor.

## Contratos propuestos para la implementación posterior

Los nombres de rutas siguientes son una propuesta, todavía no endpoints disponibles.

| Área | Operación propuesta | Regla que debe imponer el servidor |
| --- | --- | --- |
| Identidad | `POST /auth/link`, `/auth/verify`; `GET /me` | Enlaces de un uso, expiración, límites de intentos, sesión segura y rol verificado. Eliminar cambio de rol de demo y bandeja global de correos. |
| Catálogo | `GET /programs`, `/programs/:id` | Solo contenido publicable; precios, vigencia y reglas canónicos. |
| Inscripción | `POST /enrollments`; `POST /enrollments/:id/approve` | Snapshot del contrato; pago confirmado por proveedor y aprobación administrativa independientes. Evitar dobles inscripciones activas mediante transacción. |
| Pago | `POST /checkout`; `POST /webhooks/payment` | Firma del proveedor, importe/moneda/orden, idempotencia y conciliación. El cliente nunca confirma un cobro. Reembolsos con auditoría. |
| Onboarding | `PUT /me/context`; `POST /assessments/initial` | Consentimiento versionado; conservar primer diagnóstico de cada inscripción. IA orientativa separada, revisable por mentor, con consentimiento y fallback. |
| Aula | `GET /enrollments/:id/lessons`; `POST /quiz-attempts` | Alcance por inscripción, vigencia, corrección del lado servidor; no entregar respuestas correctas ocultas como control de acceso. |
| Actividades | `POST /submissions`; `POST /submissions/:id/reviews` | Propiedad, mentor asignado, nota/rúbrica, versiones inmutables y concurrencia. |
| Práctica | `POST /case-attempts` | Versión publicada, opciones válidas, puntuación calculada y puntos únicos por caso/inscripción. |
| Mentoría | `POST /bookings`; `PATCH /bookings/:id` | Cupos y solapamiento en transacción, vigencia, zonas horarias, permisos para asistencia y enlace externo. |
| Conversaciones | `POST /threads`; `POST /threads/:id/messages` | Solo alumno, mentor asignado y roles autorizados. No acceso cruzado por ID. |
| Atención | `POST /tickets`; `POST /tickets/:id/messages`; `PATCH /tickets/:id` | Disponible antes del pago; responsable, constancia, historial y permisos. Canal y plazos aprobados por Mentorinc. |
| Cierre | `POST /assessments/final`; `PUT /satisfaction` | Requisitos del contrato satisfechos; cierre conservado; encuesta por inscripción y mentoría aplicable. |
| Administración | CRUD editorial; `GET /reports`; `GET /audit` | Roles, publicación explícita, consentimiento enlazado a versión y auditoría de cambios. |

Todas las escrituras requieren identidad del servidor, validación de esquema, autorización de objeto y respuesta sin datos ajenos. Para operaciones repetibles por red usar clave de idempotencia; para edición simultánea, revisión/versionado con conflicto explícito. Fechas canónicas UTC y presentación America/Lima. No confiar en IDs, rol, reloj, precios ni puntuaciones del navegador.

## Datos a persistir

Usuarios y asignaciones; programas/módulos/lecciones; inscripciones con snapshot; eventos de pago; diagnósticos y encuestas por inscripción; entregas y revisiones; casos y versiones/intentos; disponibilidad y reservas; conversaciones/mensajes; solicitudes/eventos; políticas/consentimientos; notificaciones y eventos de auditoría.

Los adjuntos necesitan almacenamiento separado con límites, validación de tipo y acceso autorizado. Los videos y recursos finales requieren alojamiento y permisos definidos. No convertir las cadenas base64 de la demo en almacenamiento de producción sin diseñar su tratamiento.

La copia local es un respaldo de demostración, no una fuente de autenticidad. No importar automáticamente cuentas, roles, aprobaciones, pagos o consentimientos desde un JSON de navegador a producción. Preparar importación administrativa supervisada solo de contenido validado, con mapeo de IDs y reporte de rechazos.

## Activación por etapas

1. Confirmar insumos y proveedores; definir ambientes separados y accesos del equipo. Revalidar documentación oficial y costos en ese momento.
2. Implementar identidad, autorización, API y esquema con migraciones. Preparar un entorno de pruebas con datos ficticios.
3. Conectar archivos/contenido, transacciones de inscripción, disponibilidad y entregas. Probar concurrencia, reintentos y aislamiento entre alumnos.
4. Integrar pasarela en sandbox y webhooks; luego correo, recordatorios y recomendación orientativa. Verificar resultados en los proveedores, no solo mensajes en pantalla.
5. Configurar dominio, respaldo diario, recuperación probada, alertas y responsables. Documentar retención, atención y respuesta a incidentes con los responsables.
6. Recorrer alta → pago → aprobación → aprendizaje → revisión → sesión → cierre → reporte con cuentas de prueba. Capacitar al equipo, registrar aceptación y autorizar publicación operativa.

Hasta completar esta etapa la publicación en Cloudflare es una demostración local por visitante. No existe operación multiusuario real.
