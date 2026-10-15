# Operación local de Impulso

Versión funcional del 14 de octubre de 2026. Los cambios de administración afectan únicamente esta copia del navegador. No se envían solicitudes, correos ni cobros fuera de ella.

## Configurar antes de recorrer

1. Administración → Programas: editar módulos incluidos, sesiones, duración, vigencia en días (0 = sin vencimiento) y requisito de actividades aprobadas. Publicar requiere un temario disponible.
2. Administración → Contenido: editar cada lección, pregunta, respuesta correcta, actividad, rúbrica, nota mínima y recursos. Puede incorporarse una URL HTTPS de video, nombre de recurso y transcripción. La marca «validado» es una declaración del editor; requiere revisión académica real.
3. Operación → Casos guiados: ajustar situación, preguntas, tres alternativas por decisión, feedback y puntuación. Se permiten hasta cinco decisiones; los intentos anteriores conservan su versión y resultado.
4. Operación → Políticas: incorporar los textos del cliente como borrador. Registrar quién los validó solo después de esa validación. Cada guardado crea una versión; no reemplaza las aceptaciones anteriores.
5. Operación → Preparación: registrar responsables, horario, dominio acordado y la capacitación cuando se realice. Exportar inventario para el seguimiento. No escribir secretos, claves ni contraseñas.

## Recorridos conectados

| Persona | Secuencia |
| --- | --- |
| Alumno nuevo | Catálogo → ficha → registro y aceptación → confirmación local → misma ficha → inscripción y aceptación → pago simulado → aprobación de administración → diagnóstico y consentimiento → aula. |
| Alumno con dudas de acceso | Ayuda → soporte/reclamo de prueba → constancia → respuesta del administrador → cierre o reapertura. No requiere compra aprobada. |
| Aprendizaje | Guía/video → pregunta → intento guardado → respuesta correcta → lección completa → actividad/adjunto → feedback → ajustes/reentrega → aprobación. |
| Práctica | Caso incluido en el programa → decisiones secuenciales → reflexión → resultado → historial. Repetir conserva intentos sin duplicar puntos. |
| Mentor | Alumnos asignados → contexto y comparación → foco dentro del temario → conversación iniciada por mentor → entregas/versiones → feedback → sesiones/resultados. |
| Cierre | Todas las lecciones de la inscripción completas y, si se configuró, actividades aprobadas → evaluación final → comparación → satisfacción → reporte del equipo. |
| Administración | Pago confirmado → revisión manual → acceso → activación/avance → reportes y CSV → atención de solicitudes → preparación de entrega. |

## Reglas de continuidad

- Una compra guarda la selección de lecciones, precio, cupos, duración, vigencia y requisito de revisión. Editar un programa afecta inscripciones nuevas. El contenido editorial de una lección sigue siendo editable; no se promete un archivo inmutable de todos sus textos.
- La vigencia empieza al aprobar el acceso. Se excluyen accesos vencidos y no se ofrece una sesión que termine después del vencimiento. Reembolsar retira el acceso.
- Archivar módulos o lecciones los retira del catálogo para nuevas inscripciones. Los alumnos ya inscritos conservan las lecciones de su temario, su acceso mientras esté vigente y los mismos requisitos de cierre. El archivo no aumenta su porcentaje de avance. Las copias antiguas sin temario lo fijan antes de aplicar cambios editoriales.
- «Acceso vencido» se muestra también en compras y administración, con opciones para consultar el historial, elegir programa o pedir ayuda. Las pantallas de compra refrescan la vigencia cada 30 segundos y al recuperar el foco; las acciones comprueban la hora actual.
- Confirmar un pago simulado avisa al alumno y a todos los administradores activos en esta copia. El aviso del negocio enlaza con Compras y accesos. Repetir el mismo resultado no duplica avisos ni correos de prueba; la aprobación sigue siendo independiente.
- La nueva inscripción archiva progreso, medición inicial/final y satisfacción anteriores; las entregas, casos, intentos y reservas siguen vinculados a su compra. Los reportes de comparación agregan el recorrido actual. La página Mi avance muestra los recorridos archivados.
- La activación del aprendizaje cuenta alumnos con acceso vigente que completaron al menos una lección. No equivale a una cuenta registrada o a una compra aprobada. La fecha se registra desde esta versión; no se inventa para progreso histórico.
- Puntos: 10 por lección completada y 20 por caso distinto en el recorrido actual. Las insignias son reconocimiento interno, no certificados.
- La rúbrica y nota mínima son configurables y de muestra. No representan criterios académicos aprobados por el cliente hasta que este los confirme.
- El soporte deja responsable, mensajes y cambios de estado. La constancia descargada es de prueba; no es un reclamo presentado al negocio ni a una autoridad.
- Datos locales permite exportar, previsualizar e importar una copia válida. Antes de reemplazar se descarga el estado actual y se exige escribir RESTAURAR. La importación cierra la sesión; no mezcla cuentas de dos copias.

## Lo que requiere insumos reales

Material académico final y permisos de uso; temarios/reglas/precios definitivos; textos y aprobación de políticas; identidad y disponibilidad del equipo; dominio; proveedores; capacitación y aceptación de entrega. El panel hace visibles estos pendientes. Completar formularios locales no ejecuta esas acciones externas.

Ver también [conexión futura](CONEXION_BACKEND.md) y [capacitación](GUIA_Y_CAPACITACION.md).

## Recordatorios locales de mentoría

Entrar desde Agenda → Recordatorios, Notificaciones o el enlace de Operación. Administración configura la anticipación (1, 2, 12, 24 o 48 horas; 24 por defecto) y puede pausar la preparación. Alumno y mentor son los destinatarios; el alumno ve únicamente su mensaje, el mentor sus sesiones asignadas y administración el conjunto.

La vista muestra hora de sesión, momento previsto, destinatarios y texto del mensaje. Incluye el enlace de reunión cuando existe y avisa cuando todavía falta. «Simular por adelantado» permite probar una sesión concreta; «Simular avisos que ya corresponden» solo procesa los avisos pendientes cuyo momento ha llegado. Cada simulación crea notificación y correo de prueba, nunca un envío externo. La vista se refresca, pero no hay un proceso de envío automático: se requiere pulsar el botón y la página no ejecuta nada estando cerrada.

Una reserva cancelada desaparece de la cola. Reprogramar cambia el momento previsto y permite un aviso del nuevo horario; los mensajes anteriores se conservan identificados como «Sin efecto», también en Notificaciones y Correo de prueba. La regla no duplica mensajes ya simulados del mismo horario y destinatario. No se ofrecen recordatorios de sesiones pasadas, de personas inactivas o sin acceso vigente que cubra la sesión.

Configuración e historial se incluyen en la exportación/importación local. El envío automático real y su supervisión quedan para la etapa de backend/correo.
