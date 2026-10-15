# Entrega Impulso

Fecha de implementación: 14 de octubre de 2026.

## Decisiones

Dirección visual aprobada: Impulso. Se conservan el logo oficial, las tres ilustraciones aprobadas, violeta/turquesa, Space Grotesk/DM Sans, navegación horizontal, superficies redondeadas, hero menta y panel de mentoría lavanda.

La instrucción vigente limita esta etapa al frontend local. React + TypeScript + Vite permite entregar archivos estáticos en Cloudflare y conservar una base modular para integrar servicios posteriormente. Dependencias fijadas con lockfile; no se necesita Angular, Next.js ni un servidor para esta etapa.

Se mantiene el historial inicial de `RynoxNetwork/Mentorinc-Cursos` y su rama `main`. No se incorporan propuestas, cotizaciones, costos internos ni credenciales al repositorio público.

## Evidencia automatizada

- 22 pruebas de dominio pasaron: registro y confirmación, enlaces usados/caducados, diagnóstico, pago + aprobación, compras duplicadas, acceso al aula, evaluación, revisión/reentrega, mentor asignado, adjuntos/URL, reservas/cupos/solapamientos, reprogramación/cancelación, reembolso, consultas, contratos de programas, archivo de contenido, protección de roles y lectura de datos persistidos/corruptos.
- TypeScript sin errores y compilación estática correcta.
- Auditoría npm de la instalación: 0 vulnerabilidades reportadas. Es una comprobación del inventario, no una garantía de seguridad del producto futuro.

## Recorridos comprobados en navegador

- María: guía de tres pasos → respuesta correcta → progreso 27% a 33% → entrega de actividad.
- Ana: recibe actividad → feedback y nota 18/20 → aprobación; María ve el feedback después de abrir nuevamente la URL.
- Agenda: reserva reduce cupos de 2 a 1 → reprogramación mantiene 1 disponible → cancelación recupera 2 y libera horario.
- Alta ficticia: registro → correo local → confirmación → diagnóstico → recomendación Comunicación → compra Junior → pago confirmado. La URL directa de la lección sigue bloqueada hasta la aprobación manual.
- Administración: aprobación de la compra ficticia y listado de accesos aprobados; el pago pendiente de Diego mantiene desactivada la aprobación.
- Recuperación de acceso de la cuenta ficticia por enlace local y acceso al aula después de la aprobación.
- Consulta nueva del alumno → respuesta de Ana → resolución visible en el hilo.
- Creación de un programa en borrador desde administración, conservado al recargar.
- Adjunto TXT ficticio → envío de actividad → recarga: texto y enlace del archivo conservados. Una primera selección con ruta mal formada falló y se repitió con una ruta absoluta válida.
- Inspección visual de escritorio y móvil a 390 px. A 320 px se recorrieron 23 vistas: 14 de alumno, 4 de mentor y 5 de administración, todas sin desbordamiento horizontal (scrollWidth 305 px, viewport 320 px con barra de desplazamiento).
- El menú de perfil se corrigió en el ancho mínimo: límites x=14..291 dentro del contenido de 305 px. Navegación móvil y selección de perfiles comprobadas.
- Sin errores de consola en los recorridos de actividad y agenda comprobados.

No se presentan estas pruebas como evidencia de cobros, correo real, autorización de servidor o funcionamiento multiusuario.

## Publicación manual inicial verificada

- URL principal: <https://mentorinc-impulso.pages.dev/>.
- Versión de aplicación: commit `2a93e66`, posterior a la implementación `0639ab3`, ambos subidos a `main`.
- Cloudflare Pages, proyecto `mentorinc-impulso`, carga estática directa. Despliegue `cb169d3d-2c09-4103-a54a-53ae22f3dc26`, estado **success**, 14 de octubre de 2026 a las 08:36 (Lima).
- URL de esa versión: <https://cb169d3d.mentorinc-impulso.pages.dev/>.
- ZIP: 16 entradas (14 archivos públicos y las reglas `_headers` / `_redirects`), integridad y correspondencia con `dist/` verificadas. SHA-256: `0df31218362021fb31d9443a5c586d8d0f79c953f4afc867799c4ad981084392`.
- Los 14 archivos descargados desde la URL pública coinciden por SHA-256 con el build local. La ruta directa `/leccion/com-2` responde con el mismo HTML de entrada; la redirección canónica de `/index.html` se siguió en la comprobación.
- Respuesta HTTP 200, CSP, `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` confirmados públicamente.
- Navegador público: completar lección → recargar su URL directa → estado completado persistido → inicio con progreso 33%. Sin errores ni advertencias de consola en este recorrido.
- Inicio público a 390 px: scrollWidth y ancho de contenido 375 px, sin desbordamiento. Menú de cuenta abre y Escape lo cierra; se retiró la emulación al terminar.

Esta primera publicación se hizo por carga directa, antes de autorizar el repositorio en la aplicación de Cloudflare. `mentorinc-impulso` conserva esa versión histórica; los nuevos commits se publican en el proyecto Git descrito a continuación.

Las capturas de escritorio y móvil y el manifiesto de comprobación quedan en la carpeta local de entrega; no contienen datos reales de alumnos. El commit posterior de documentación no cambia los archivos desplegados.

## Integración Git y nueva publicación

- Proyecto `mentorinc-cursos`, conectado a `RynoxNetwork/Mentorinc-Cursos`, rama de producción `main`, despliegues automáticos activados.
- URL: <https://mentorinc-cursos.pages.dev/>. La aplicación sigue siendo estática y local; la conexión Git no incorpora servicios de backend.
- Primer despliegue: `e41aaae2-d425-488c-ab64-1a0c55b88156`, commit `3911401a5c4c7fd73473642d32842fc735746aef`, estado `success`, 14 de octubre de 2026 a las 20:43 (Lima), duración 33 s.
- El log confirma Node `24.18.0`, instalación con `npm ci`, 22 pruebas aprobadas, comprobación TypeScript y compilación Vite. No se detectó directorio de funciones.
- Se ajusta la regla de rutas global que Cloudflare ignoraba por bucle, utilizando su soporte SPA nativo. La configuración completa está en `docs/DESPLIEGUE.md`.
- Prueba de automatización: el push de `2820a1d9fddea0f0928416a55987f6480ba1ca57` disparó el despliegue `3a8618a3-3a14-4c7c-8368-4ec5920b07e5` sin carga manual. Finalizó en `success` a las 20:45 (Lima), con 22 pruebas aprobadas, TypeScript/build correctos y sin la advertencia de redirección. GitHub informa el check `Cloudflare Pages` como `completed / success` para ese mismo SHA.
- Nueva URL pública: HTTP 200 y cabeceras configuradas presentes. `/` y `/leccion/com-2` sirven el mismo HTML que el build local (SHA-256 `126c72393dab56012918eefbaec0681add2ac1f2d19c2ba997d50fa4ccc17697`). La lección abre tras recargar su URL directa; sin errores ni advertencias de consola en esta comprobación.
- Los datos guardados en el origen anterior permanecen allí: la nueva URL tiene su propio almacenamiento local.

## Pendientes de contenido y etapa posterior

### Ampliación local de medición

Se implementaron comparación inicial/final, satisfacción, métricas de mentoría y onboarding ampliado, conservando Impulso y los datos anteriores. El alcance, fórmulas, migración y pruebas están en [MEDICION.md](MEDICION.md). La suite pasa de 22 a 32 pruebas; el recorrido local y la compilación están comprobados. Los commits se publican por la integración Git existente.

Mentorinc debe definir los videos/materiales finales, precios/cupos definitivos, instrumento y criterios del diagnóstico y reglas operativas de agenda. El editor local permite ajustar el contenido de demostración. Backend, base de datos, autenticación segura, cobros, correo transaccional e IA real quedan expresamente fuera de esta entrega por instrucción de Jose Maria.
