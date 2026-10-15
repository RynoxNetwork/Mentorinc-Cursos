# Evidencia de la ampliación local

14 de octubre de 2026. Esta entrega amplía Impulso sobre la versión de medición anterior. Los originales comerciales se mantienen fuera del repositorio público.

## Implementado

Fichas y temarios diferenciados; continuidad de la selección durante el alta; contratos de inscripción conservados; vigencia y requisitos configurables; consentimiento versionado; soporte antes del pago con responsable, estado y constancia; rúbricas, nota mínima, intentos y reentregas; tres casos editables con historial; puntos e insignias internos; conversaciones iniciadas por mentor; activación del aprendizaje; historial de recorridos; importación y recuperación de datos; ayuda por roles; preparación de contenido, políticas y entrega.

## Verificación

- 50 pruebas de dominio, medición, migración y operaciones aprobadas; TypeScript y build de Vite correctos.
- Se mantiene almacenamiento anterior a la versión 3: María conserva sus 15 lecciones y su cierre. Las compras nuevas respetan el temario configurado.
- En navegador se configuró un programa ficticio de tres lecciones con revisión obligatoria. Alumna nueva: catálogo → registro → confirmación → programa conservado → inscripción → pago simulado → aprobación → diagnóstico → intentos incorrecto/correcto → tres entregas → ajustes → reentrega → aprobación → cierre → satisfacción.
- El cierre permaneció bloqueado mientras faltaba revisión, pese al 100% de lecciones. Tras aprobar la última actividad se habilitó. Comparación inicial 2/5 y final 4/5 conservada; satisfacción sin mentoría realizada no pide esa valoración.
- Reentrega conserva el texto, feedback y nota anteriores. Mentor ve contexto, casos y puede iniciar la conversación. Mentor y administración también pueden consultar recorridos archivados; la vista se comprobó con una copia ficticia preparada para ese caso, sin incorporarla a los datos públicos.
- Caso con resultado 6/6, edición posterior del feedback y reintento 0/6: dos intentos con resultados propios; el anterior conserva su feedback original y el total permanece en 50 puntos (tres lecciones y un caso).
- Solicitud de reclamo ficticia antes del pago → referencia y responsable → constancia descargada → respuesta administrativa → cierre → reapertura por alumna con historial visible.
- Política v1 → nuevo borrador v2; aceptaciones previas siguen referenciando v1. La vista pública muestra v2 como borrador.
- Descargas de guía por roles, inventario y copia JSON. Importación con vista previa → copia previa descargada → restauración → sesión cerrada → reingreso con comparación y satisfacción conservadas.
- Navegación y formularios revisados en escritorio y en anchos de 390/320 px: operación, casos, resultados, soporte y políticas sin desbordamiento horizontal en las vistas comprobadas.
- Compilación estática recorrida en navegador sin errores de consola de la aplicación. Durante cambios en caliente del desarrollo apareció una invalidación de contexto; la recarga recuperó la vista y la comprobación estática no reprodujo el error.

Las cuentas y cambios usados para probar existen únicamente en el navegador de prueba. No se agregaron como datos del sitio público. No se simula como realizado ningún cobro, envío, entrenamiento del cliente ni conexión de servicio.

## Pendiente de la siguiente etapa

Conexiones reales de autenticación, API, base de datos, pagos, correo/recordatorios, IA orientativa, almacenamiento/video, respaldo y monitoreo. También los insumos y validaciones de Mentorinc: material académico, políticas, reglas/precios definitivos, responsables, dominio y capacitación efectiva.

Consultar [operación local](OPERACION_LOCAL.md), [guía de capacitación](GUIA_Y_CAPACITACION.md) y [contratos de conexión](CONEXION_BACKEND.md). La publicación automática se verifica con el check de Cloudflare del commit publicado y las rutas públicas.
