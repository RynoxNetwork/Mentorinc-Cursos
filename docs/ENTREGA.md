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
- Inspección visual de escritorio y primera revisión móvil a 390 px; sin errores de consola en los recorridos comprobados hasta este punto.

La evidencia adicional responsive, funcional y pública se incorporará al cerrar la publicación. No se presentan estas pruebas como evidencia de cobros, correo real, autorización de servidor o funcionamiento multiusuario.

## Pendientes de contenido y etapa posterior

Mentorinc debe definir los videos/materiales finales, precios/cupos definitivos, instrumento y criterios del diagnóstico y reglas operativas de agenda. El editor local permite ajustar el contenido de demostración. Backend, base de datos, autenticación segura, cobros, correo transaccional e IA real quedan expresamente fuera de esta entrega por instrucción de Jose Maria.
