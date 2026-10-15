# Continuidad de inscripciones y recordatorios locales

Actualización del 14 de octubre de 2026. Mantiene Impulso, las dependencias existentes y el almacenamiento en el navegador. No añade backend, base de datos, servicios de correo ni tareas externas.

## Cambios

1. Archivar una lección o módulo retira su oferta del catálogo; los inscritos conservan el temario adquirido y pueden terminarlo. Progreso y cierre usan sus requisitos. Las copias antiguas sin selección de lecciones la fijan antes de aplicar cambios. Una copia con IDs de lección inexistentes o duplicados se rechaza al importar.
2. Confirmar un pago de prueba genera aviso y correo local al alumno y a los administradores activos, con referencia de compra y acceso al panel de revisión. Repetir el mismo resultado no duplica mensajes. Pagar no aprueba el acceso automáticamente.
3. Una compra vencida muestra su estado, fecha y opciones para consultar el historial, elegir programa o solicitar ayuda. El aula explica el vencimiento. Compras, administración, acceso y saldo comparten el criterio de vigencia; el progreso se conserva.
4. Agenda y Operación enlazan a Recordatorios. La vista permite configurar anticipación/pausa, previsualizar destinatarios y mensajes, simular por adelantado o procesar los avisos que ya corresponden. Se conserva el historial y se invalidan mensajes de horarios cancelados/reprogramados. Cada destinatario recibe como máximo una simulación por revisión de horario.

El alumno ve su mensaje; el mentor ve y simula sus sesiones; administración configura y puede simular el conjunto. El mensaje incorpora el enlace externo de la reunión si existe. Simulación significa crear aviso y correo en esta copia: no hay entrega externa ni ejecución automática al cerrar el navegador.

## Verificación

- 65 pruebas de dominio, medición, operaciones, continuidad y recordatorios. Las 15 nuevas cubren archivo de lección/módulo, temarios históricos, cierre, contenido ausente, navegación del aula sin lecciones ajenas, pago y reintentos, vencimiento, destinatarios, fechas, aislamiento por rol/asignación, pausa, cambio de regla, reprogramación, cancelación y respaldo.
- La prueba anterior que exigía bloquear el aula al archivar se actualizó al contrato corregido: retirar del catálogo y conservar las inscripciones existentes.
- TypeScript y build de Vite correctos. No se añadieron dependencias.
- Navegador sobre compilación estática: administración archivó Negociación; María conservó el 27% y las 15 lecciones, abrió y completó una de ese módulo; pasó al 33% por aprendizaje real.
- Diego confirmó un pago ficticio; administración recibió aviso y correo, abrió Compras desde la notificación y aprobó el acceso.
- María reservó sesión; su vista mostró solo su destinatario. Ana previsualizó y simuló para ambos. La alumna recibió el aviso y abrió Agenda desde él. Reprogramar actualizó la fecha prevista y marcó el anterior «Sin efecto»; cancelar retiró la cola.
- Otra reserva, con regla de 48 horas, quedó lista según el reloj actual. La simulación por fecha redujo el pendiente de 1 a 0 y agregó un mensaje por destinatario. La recarga conservó la regla y el historial.
- Se importó una copia ficticia con vigencia pasada para verificar visualmente «Acceso vencido», ausencia de «Entrar al aula» y bloqueo explicado en la lección. Después se restauró la copia previa de la prueba, con su historial de recordatorios.
- Vistas comprobadas a 390 y 320 px, incluidos estado vencido y mensaje desplegado: sin desbordamiento horizontal. Se ajustó la disposición móvil de título, estado y acción de recordatorios. Consola de la compilación revisada sin errores ni advertencias capturados.

Las personas y operaciones de la prueba son ficticias y permanecen fuera del contenido inicial publicado. La copia del escenario vencido y las capturas se guardaron fuera del repositorio público. La publicación se comprueba después del push mediante el check de Cloudflare y la comparación de los archivos servidos con la compilación.

## Uso y siguiente etapa

Ver [operación local](OPERACION_LOCAL.md) y [conexión futura](CONEXION_BACKEND.md). Los tres defectos de esta revisión quedan corregidos localmente. Los servicios reales y los insumos/aprobaciones de Mentorinc conservan su condición de pendientes.
