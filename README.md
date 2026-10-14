# Mentorinc-Cursos

Aplicación de Mentorinc con la dirección visual **Impulso**, aprobada por Jose Maria. Frontend funcional en React, TypeScript y Vite, con identidad, logo e ilustraciones propias del proyecto.

**Demo publicada:** [mentorinc-impulso.pages.dev](https://mentorinc-impulso.pages.dev/). Publicación estática manual; los datos se guardan únicamente en el navegador de cada visitante.

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
- Registro y confirmación de correo de prueba, perfil y diagnóstico orientativo de cuatro áreas. La recomendación utiliza reglas locales y es revisable por el mentor; no ejecuta IA ni presenta validez clínica, DISC o PPDC.
- Compra simulada con pago pendiente, confirmado, fallido o reembolsado. El acceso exige pago confirmado **y** aprobación manual de administración.
- Aula con cinco módulos, quince lecciones distintas, guías interactivas, comprobaciones de aprendizaje, progreso, recursos descargables y reproductor para archivos de video HTTPS incorporados desde administración.
- Actividades con texto y adjuntos PDF/TXT/imagen de hasta 500 KB; feedback, nota, solicitud de ajustes, reentrega y aprobación.
- Consultas privadas por alumno/mentor, respuestas, resolución y reapertura; notificaciones y bandeja de correo de prueba.
- Agenda por cupos y duración del programa, horario de Lima, reserva, reprogramación, cancelación, enlace externo y registro de sesión realizada. Las reservas impiden solapamientos, incluso entre sesiones de diferente duración.
- Mentor: alumnos asignados, objetivos, diagnóstico, progreso, foco de la ruta, entregas, feedback, consultas, sesiones y disponibilidad.
- Administración: métricas derivadas de los datos, personas/roles/mentores/estado, exportación CSV, compras/accesos/reembolsos, programas, módulos, lecciones, evaluaciones, enlaces de recursos, publicación y archivo reversible.
- Persistencia local versionada, sincronización entre pestañas del mismo navegador, exportación JSON y restablecimiento con copia previa. Los datos corruptos se conservan hasta que el usuario los exporte y restablezca explícitamente.

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

Publicación estática directa del contenido de `dist/`. `_redirects` permite abrir rutas internas, y `_headers` configura las cabeceras del sitio. No se crean Workers de aplicación, bases de datos ni funciones.

Para una futura integración Git: rama `main`, comando `npm run build`, salida `dist`, raíz `/`, Node `24.18.0`. La integración de GitHub debe tener acceso al repositorio. Los commits en GitHub y los despliegues manuales son operaciones distintas; consultar `docs/ENTREGA.md` para el estado verificado de esta entrega.

Fuentes técnicas: [Vite](https://vite.dev/guide/), [React](https://react.dev/learn/build-a-react-app-from-scratch), [Cloudflare Pages para React](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).
