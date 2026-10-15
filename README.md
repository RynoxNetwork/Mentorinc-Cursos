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

- Sitio público, modelo de Mentorinc, catálogo Junior/Senior/Master y recuperación de acceso por enlace local.
- Registro y confirmación de correo de prueba, perfil y onboarding con experiencia, contexto de venta, estilo propio y objetivo. Diagnóstico orientativo de cuatro áreas conservado como medición inicial. La recomendación utiliza reglas locales y es revisable por el mentor; no ejecuta IA ni presenta validez clínica, DISC o PPDC.
- Comparación inicial/final por área, fecha y reflexión. La evaluación final se habilita con un programa aprobado y todas las lecciones publicadas completas; guardar el cierre no reemplaza la medición inicial.
- Encuesta de satisfacción al cierre, editable sin duplicar respuestas. La valoración de mentoría solo se solicita cuando hay sesiones realizadas; los reportes muestran promedios y cantidad de respuestas, con estados vacíos explícitos.
- Compra simulada con pago pendiente, confirmado, fallido o reembolsado. El acceso exige pago confirmado **y** aprobación manual de administración.
- Aula con cinco módulos, quince lecciones distintas, guías interactivas, comprobaciones de aprendizaje, progreso, recursos descargables y reproductor para archivos de video HTTPS incorporados desde administración.
- Actividades con texto y adjuntos PDF/TXT/imagen de hasta 500 KB; feedback, nota, solicitud de ajustes, reentrega y aprobación.
- Consultas privadas por alumno/mentor, respuestas, resolución y reapertura; notificaciones y bandeja de correo de prueba.
- Agenda por cupos y duración del programa, horario de Lima, reserva, reprogramación, cancelación, enlace externo y registro de sesión realizada. Las reservas impiden solapamientos, incluso entre sesiones de diferente duración.
- Mentor: alumnos asignados, objetivos, diagnóstico, progreso, foco de la ruta, entregas, feedback, consultas, sesiones y disponibilidad.
- Administración: métricas derivadas de los datos, personas/roles/mentores/estado, exportación CSV, compras/accesos/reembolsos, programas, módulos, lecciones, evaluaciones, enlaces de recursos, publicación y archivo reversible.
- Resultados para mentor y administración: comparaciones, satisfacción, cupos aprobados/reservados/realizados/disponibles, cancelaciones y minutos de mentoría; filtros por fecha en Lima y mentor, fichas individuales y exportación CSV. Ver [criterios de medición](docs/MEDICION.md).
- Persistencia local versionada, sincronización entre pestañas del mismo navegador, exportación JSON y restablecimiento con copia previa. Los datos corruptos se conservan hasta que el usuario los exporte y restablezca explícitamente.

La versión 2 del esquema conserva el almacenamiento existente. Al abrir datos de la versión 1, el último diagnóstico disponible se conserva como referencia inicial con fecha desconocida; no se inventan mediciones previas ni encuestas.

## Probar los tres espacios

El menú de cuenta permite cambiar entre María (alumna con acceso), Diego (alumno con pago pendiente), Ana (mentora) y Equipo Mentorinc (administración). La página de acceso también ofrece cuentas de prueba.

Para probar el alta desde cero: cerrar sesión → crear cuenta con un correo ficticio → abrir Correo de prueba → confirmar → diagnóstico → elegir programa → simular pago → cambiar a administración → aprobar acceso. Para regresar a la cuenta creada, cerrar sesión y solicitar un enlace usando el mismo correo.

Las cuentas de muestra usan `example.test`. No se necesitan contraseñas. **La simulación de roles no es autenticación segura:** cualquiera que abra la demo puede recorrer todos los espacios de sus propios datos locales.

## Alcance y datos

Esta etapa sigue la instrucción explícita de implementar todo el frontend **sin base de datos, backend ni integraciones reales**. `localStorage` es almacenamiento del navegador, no una base remota ni una frontera de seguridad. Cada navegador/origen tiene sus propios datos; no existe sincronización entre personas o dispositivos. No introducir información sensible.

Los nombres de alumnos, mensajes, importes de programas y reglas de sesiones son de muestra. No se realizan cobros ni se envían correos. El material académico es una muestra revisable, y los videos finales se incorporarán cuando Mentorinc los facilite. Los importes de los programas no son la cotización del desarrollo.

El alcance funcional se trazó contra la propuesta presentada, la cotización vigente y la dirección visual aprobada. Los documentos comerciales originales y costos internos se conservan fuera de este repositorio público.

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
