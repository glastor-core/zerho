# 🛡️ Política de Seguridad (Security Policy)

En el proyecto **Zerho** (`glastor-core/zerho`), desarrollado por `GLASTOR-DEV` (división de
desarrollo de GLASTOR®), la seguridad del software y la protección de la cadena de suministro son
prioridades fundamentales.

---

## 📦 Versiones Soportadas

Mantenemos actualizaciones de seguridad activas para las versiones estables de Zerho:

| Versión | Estado de Soporte  | Tipo de Soporte                       |
| :------ | :----------------- | :------------------------------------ |
| `1.5.x` | :white_check_mark: | Soporte activo y parches inmediatos   |
| `1.x`   | :white_check_mark: | Soporte activo y parches de seguridad |
| `< 1.0` | :x: No soportada   | Fin de ciclo de vida (EOL)            |

---

## 🚨 Reporte Responsable de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad o un fallo que comprometa la integridad de Zerho, su
sandbox de ejecución o sus endpoints perimetrales, te solicitamos **no abrir un issue público**. En
su lugar, activa nuestro protocolo de divulgación coordinada:

### Opción 1: GitHub Private Vulnerability Reporting (Recomendado)

Accede directamente a la herramienta oficial de GitHub: 👉
[Reportar vulnerabilidad privada en Zerho](https://github.com/glastor-core/zerho/security/advisories/new)

### Opción 2: Correo Electrónico Seguro

Envía los detalles técnicos a nuestro canal de integridad: 📧
**[glastor.info@gmail.com](mailto:glastor.info@gmail.com)**

### Información a Incluir en el Reporte

Para acelerar el triaje y la mitigación, incluye:

- Descripción clara del fallo o vector de ataque (ej. escape de sandbox en el playground,
  vulnerabilidad en el parser Markdown o inyección en endpoints de IA).
- Pasos mínimos de reproducción o repositorio de prueba conceptual (PoC).
- Impacto potencial en producción.
- Código sugerido de mitigación o parche (si está disponible).

---

## ⏱️ SLA y Compromiso de Respuesta

- **Acuse de recibo:** Menos de 48 horas laborales.
- **Evaluación y confirmación:** Menos de 5 días hábiles.
- **Publicación del parche y Advisory:** Divulgación coordinada una vez que la versión con la
  solución esté disponible para todos los usuarios.

Agradecemos profundamente el compromiso de la comunidad y los investigadores de seguridad que
colaboran en hacer de Zerho un estándar seguro para todos.
