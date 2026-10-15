# Mentorinc-Cursos

Aplicación de Mentorinc con la dirección visual **Impulso**, aprobada por Jose Maria. Frontend funcional en React, TypeScript y Vite, con identidad, logo e ilustraciones propias del proyecto.

**Demo con publicación automática:** [mentorinc-cursos.pages.dev](https://mentorinc-cursos.pages.dev/). Cloudflare Pages compila y publica los commits de `main` después de superar las pruebas. Los datos se guardan únicamente en el navegador de cada visitante.

## Ejecutar

Requiere Node.js 22.12 o superior; desarrollada con Node 24.18.0.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`dist/` contiene la aplicación estática completa. No requiere variables de entorno, backend, base de datos ni procesos de servidor en el alojamiento. Las fuentes e imágenes forman parte del paquete.

## Recorridos implementados

- Sitio público, modelo de Mentorinc y fichas de programas con temario, vigencia, cupos y requisitos. La elección se conserva durante registro, confirmación y compra. Junior/Senior/Master tienen recorridos de muestra de 9/12/15 lecciones, editables desde administración.
- Registro y confirmación de correo de prueba, perfil y onboarding con experiencia, contexto de venta, estilo propio y objetivo. Diagnóstico orientativo de cuatro áreas conservado como medición inicial. La recomendación utiliza reglas locales y es revisable por el mentor; no ejecuta IA ni presenta validez clínica, DISC o PPDC.
- Comparación inicial/final por área, fecha y reflexión. El cierre requiere acceso vigente y las lecciones de la inscripción completas; cada programa puede exigir también actividades aprobadas. Una nueva inscripción conserva el recorrido anterior en el historial.
- Encuesta de satisfacción al cierre, editable sin duplicar respuestas. La valoración de mentoría solo se solicita cuando hay sesiones realizadas; los reportes muestran promedios y cantidad de respuestas, con estados vacíos explícitos.
- Compra simulada con pago pendiente, confirmado, fallido o reembolsado. El acceso exige pago confirmado **y** aprobación manual de administración.
- Aula con cinco módulos, quince lecciones distintas, guías interactivas, comprobaciones de aprendizaje, progreso, recursos descargables y reproductor para archivos de video HTTPS incorporados desde administración.
- Actividades con texto y adjuntos PDF/TXT/imagen de hasta 500 KB; rúbrica y nota mínima configurables, feedback, ajustes, reentrega con versiones anteriores y aprobación. Intentos de preguntas conservados, incluidos los incorrectos.
- Tres casos guiados de muestra con decisiones, feedback, reflexión e historial versionado. Puntos e insignias internos sin certificación; repetir una práctica no duplica los puntos del caso.
- Ayuda y solicitudes antes del pago: soporte o reclamo de prueba, referencia, responsable, respuestas, estado, reapertura y constancia descargable local.
- Páginas de privacidad, condiciones y devoluciones, borradores editables, versiones conservadas y aceptación explícita en registro, inscripción y diagnóstico. Los textos requieren validación de Mentorinc.
- Consultas privadas por alumno/mentor, respuestas, resolución y reapertura; notificaciones y bandeja de correo de prueba.
- Agenda por cupos y duración del programa, horario de Lima, reserva, reprogramación, cancelación, enlace externo y registro de sesión realizada. Las reservas impiden solapamientos, incluso entre sesiones de diferente duración.
- Mentor: alumnos asignados, objetivos, diagnóstico, progreso, foco de la ruta, entregas, feedback, consultas, sesiones y disponibilidad.
- Administración: métricas derivadas de los datos, personas/roles/mentores/estado, exportación CSV, compras/accesos/reembolsos, programas, módulos, lecciones, evaluaciones, enlaces de recursos, publicación y archivo reversible.
- Resultados para mentor y administración: comparaciones, satisfacción, cupos aprobados/reservados/realizados/disponibles, cancelaciones y minutos de mentoría; filtros por fecha en Lima y mentor, fichas individuales y exportación CSV. Ver [criterios de medición](docs/MEDICION.md).
- Panel de operación con preparación del contenido, políticas, responsables, dominio y capacitación; inventario exportable. Guía por roles dentro de la aplicación y descargable.
- Persistencia local versionada, sincronización entre pestañas del mismo navegador, exportación e importación JSON con validación, vista previa y copia previa. Los datos corruptos se conservan hasta que el usuario los exporte y restablezca explícitamente.

La versión 3 migra las versiones 1 y 2 sin perder las mediciones ni acortar los temarios adquiridos. Mantiene la clave original de almacenamiento. Los recorridos anteriores conservan el temario previo completo; la segmentación nueva aplica a compras nuevas. Un diagnóstico de versión 1 se conserva con fecha desconocida, sin inventar mediciones anteriores, encuestas, consentimientos ni fechas de activación.

## Probar los tres espacios

El menú de cuenta permite cambiar entre María (alumna con acceso), Diego (alumno con pago pendiente), Ana (mentora) y Equipo Mentorinc (administración). La página de acceso también ofrece cuentas de prueba.

Para probar el alta desde cero: cerrar sesión → elegir programa → crear cuenta con un correo ficticio → confirmar en Correo de prueba → revisar el programa conservado → solicitar inscripción → simular pago → cambiar a administración → aprobar acceso → volver al alumno → diagnóstico → lecciones y actividades → revisión del mentor → cierre y satisfacción. Para regresar a la cuenta creada, cerrar sesión y solicitar un enlace usando el mismo correo.

Las cuentas de muestra usan `example.test`. No se necesitan contraseñas. **La simulación de roles no es autenticación segura:** cualquiera que abra la demo puede recorrer todos los espacios de sus propios datos locales.

## Alcance y datos

Esta etapa sigue la instrucción explícita de implementar todo el frontend **sin base de datos, backend ni integraciones reales**. `localStorage` es almacenamiento del navegador, no una base remota ni una frontera de seguridad. Cada navegador/origen tiene sus propios datos; no existe sincronización entre personas o dispositivos. No introducir información sensible.

Los nombres de alumnos, mensajes, importes de programas y reglas de sesiones son de muestra. No se realizan cobros ni se envían correos. El material académico es una muestra revisable, y los videos finales se incorporarán cuando Mentorinc los facilite. Los importes de los programas no son la cotización del desarrollo.

El alcance funcional se trazó contra la propuesta presentada, la cotización vigente y la dirección visual aprobada. Los documentos comerciales originales y costos internos se conservan fuera de este repositorio público.

Ver [operación y criterios locales](docs/OPERACION_LOCAL.md), [guía y capacitación](docs/GUIA_Y_CAPACITACION.md) y [contratos para la futura conexión](docs/CONEXION_BACKEND.md). Estos contratos son una especificación de continuidad: todavía no existe API remota y conectar producción requerirá implementación y verificación propias.

## Estructura

```text
src/model.ts       Tipos, esquema persistido y selectores
src/seed.ts        Datos y material formativo de muestra
src/domain.ts      Reglas y operaciones locales, sin efectos de red
src/store.tsx      Persistencia, errores y contexto React
src/pages/        Pantallas de alumno, mentor y administración
src/style.css     Sistema visual Impulso y responsive
src/domain.test.ts Pruebas de reglas y persistencia
public/images/    Logo e ilustraciones aprobadas
```

No se interpreta HTML aportado por usuarios. Los enlaces de contenido admiten únicamente HTTPS, y los adjuntos se limitan por tipo y tamaño. La exportación CSV neutraliza fórmulas. Estos controles ayudan a la demostración; un backend futuro deberá validar permisos, propiedad, pagos y contenido independientemente del cliente.

## Publicación en Cloudflare Pages

El proyecto `mentorinc-cursos` está conectado a este repositorio. Publica archivos estáticos de `dist/`; `_headers` configura las cabeceras. Las rutas internas usan el soporte SPA nativo de Pages: no añadir un `404.html` en la raíz ni una reescritura global a `/index.html`.

Configuración: rama `main`, comando `npm ci && npm test && npm run build`, salida `dist`, raíz `/`, Node `24.18.0` y `SKIP_DEPENDENCY_INSTALL=1`. No requiere secretos de aplicación, Workers, bases de datos ni funciones. Consultar `docs/DESPLIEGUE.md` para la operación y `docs/ENTREGA.md` para la evidencia.

La demo anterior [mentorinc-impulso.pages.dev](https://mentorinc-impulso.pages.dev/) se conserva como publicación manual histórica. Los datos locales de esa dirección no se trasladan automáticamente a la nueva.

Fuentes técnicas: [Vite](https://vite.dev/guide/), [React](https://react.dev/learn/build-a-react-app-from-scratch), [Cloudflare Pages para React](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).
