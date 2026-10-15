# Medición del recorrido local

Implementación del 14 de octubre de 2026, manteniendo la dirección visual Impulso. Todo se guarda en el navegador: no hay servicios, base de datos, IA, correo ni sincronización entre personas. Los criterios siguientes son reglas de esta demostración que Mentorinc puede revisar.

## Recorrido del alumno

1. Confirmar el correo local y abrir **Tu punto de partida**. Registrar experiencia (cuatro tramos), contexto de venta, estilo descrito por el alumno, objetivo y cuatro escalas orientativas de 1 a 5.
2. Guardar la medición inicial una sola vez. **Mi contexto** permite actualizar experiencia, contexto, estilo y objetivo actual; conserva las respuestas, fecha y objetivo del inicio, y no reemplaza el foco ajustado por el mentor.
3. **Mi avance** muestra la comparación y el saldo de mentoría. Con pago confirmado, acceso aprobado y todas las lecciones publicadas completas, se habilita la evaluación final. No se usa el porcentaje redondeado para habilitarla; una ruta sin lecciones no permite cerrar.
4. Responder las mismas cuatro preguntas y una reflexión. La evaluación final se guarda una vez; admite puntuaciones iguales o menores. No altera las respuestas iniciales ni las actividades, notas o feedback del mentor.
5. Completar satisfacción general y utilidad del aprendizaje (1–5), con comentario opcional. Valorar mentoría solo si existe al menos una sesión realizada. La respuesta es identificada, visible para mentor y administración. Se puede corregir: conserva su fecha de creación, actualiza la de modificación y sigue contando como una respuesta.

La medición y encuesta corresponden al recorrido del alumno, no a cada compra. Las cuentas de muestra no incluyen encuestas ni evaluaciones finales fabricadas. No presentar estas escalas como instrumento psicológico validado ni como una evaluación de desempeño comercial.

## Resultados del equipo

- **Mentor → Resultados:** alumnos actualmente asignados, incluidos inactivos. La asignación actual define el conjunto de alumnos del reporte.
- **Administración → Resultados:** todos los alumnos o el mentor actual seleccionado, incluida la opción sin mentor.
- Cada ficha conserva contexto comercial, objetivo actual, ambas mediciones, reflexión y última opinión. El detalle individual muestra el historial completo aun al filtrar fechas; los indicadores y las columnas de resultados del CSV sí respetan el periodo.
- CSV con una fila por alumno seleccionado, contexto, mediciones y fechas, satisfacción y uso de mentoría. Celdas con prefijos de fórmula se neutralizan; no se exportan respuestas ajenas al conjunto seleccionado.

## Cálculos y denominadores

| Indicador | Regla |
| --- | --- |
| Comparaciones | Alumnos con medición inicial y final cuya fecha final está en el periodo. |
| Promedio por área | Media inicial y final de ese mismo conjunto; nunca completar ausencias con cero. |
| Cambio medio | Media de la diferencia final − inicial de las cuatro áreas, en puntos de la escala 1–5. |
| Satisfacción / utilidad | Media de la última respuesta por alumno cuya actualización está en el periodo. Se indica el número de respuestas. |
| Valoración de mentoría | Media solo de respuestas aplicables; «no aplica» no cuenta como cero. Se muestra su propio número de respuestas. |
| Cupos habilitados | Suma del contrato de compras con pago confirmado y aprobación vigente, sin filtro de fechas. Excluye reembolsos y compras pendientes. |
| Reservados / realizados / disponibles | Estados de esas compras. Disponibles = suma por compra de `máximo(0, cupos − reservados − realizados)`. |
| Utilización | Realizados / cupos habilitados. Sin cupos se muestra «sin cupos», no un porcentaje inventado. |
| Actividad del periodo | Reservas según su fecha programada en Lima, separadas en confirmadas, realizadas y canceladas; incluye historial de compras reembolsadas. |
| Minutos realizados | Suma de duración de las sesiones realizadas en el periodo. |

Las fechas son inclusivas y usan America/Lima. Sin fechas, se considera todo el historial. El saldo actual se separa visualmente de la actividad histórica. Reprogramar mueve la fecha de la misma reserva y no la duplica; cancelar libera su cupo. El reporte refleja el estado actual de cada reserva, no un registro histórico de eventos de cancelación/reprogramación.

## Conservación de datos

Se mantiene la clave `mentorinc.impulso.v1` para encontrar los navegadores existentes; el documento guardado usa `version: 2`. Al leer una versión 1 válida, se preservan usuarios, sesión, compras, progreso, entregas, mensajes y reservas. El último diagnóstico de cuatro valores se copia a la medición inicial con `source: anterior` y `date: null`. La interfaz explica que no puede reconstruir la fecha ni respuestas previas que la versión anterior hubiera reemplazado.

La migración es idempotente y se guarda con la siguiente operación del usuario. Datos corruptos o de versiones desconocidas conservan el bloqueo de escritura y la opción de exportar el original antes de restablecer. Los datos de las pruebas visuales no se incorporan al código ni a la demo de otros visitantes.

## Comprobaciones realizadas

- 32 pruebas aprobadas (22 previas y 10 nuevas): migración sin pérdida, inicio conservado, requisitos del cierre, permisos locales, encuesta única, cálculos con reprogramación/cancelación/asistencia/reembolso, fechas de Lima y protección de CSV.
- TypeScript y compilación estática correctos.
- Navegador con almacenamiento anterior: el progreso de María y su diagnóstico se conservan, se actualiza el contexto, se completan las lecciones pendientes, se guarda la evaluación final y sigue visible al recargar.
- Comparación comprobada con diferencias +1, +2, −1 y 0. Encuesta 4/5 corregida a 3/5: el reporte sigue contando una respuesta y excluye mentoría no realizada.
- Alta ficticia nueva → confirmación local → onboarding ampliado → medición inicial fechada → recarga con datos conservados.
- Mentor y administración: ficha de la alumna, contexto y opinión; filtro sin resultados, selección sin mentor, exportación deshabilitada sin alumnos y descarga CSV con valores coincidentes.
- Inspección visual de escritorio y móvil; onboarding y reportes cerrados/abiertos a 320 px sin desbordamiento horizontal. La verificación pública se realiza después del push mediante el check de Cloudflare y las rutas afectadas.
