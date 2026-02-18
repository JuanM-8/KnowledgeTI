# KnowledgeTI — Base de Conocimiento Técnica

Aplicación web desarrollada para centralizar preguntas frecuentes, soluciones y recursos técnicos de forma segura y organizada.

---

# Tecnologías utilizadas

- React  
- Auth0 (autenticación)  
- Supabase (base de datos)  
- Netlify (deploy)
- Apoyo de IA

---

# Objetivo del proyecto

KnowledgeTI permite consultar soluciones técnicas de manera rápida mediante una interfaz tipo tarjetas (cards).

---
##  ◼️Sistema de autenticación

La aplicación implementa un flujo de autenticación robusto usando **Auth0** con las siguientes características:

- El login se realiza exclusivamente mediante Auth0.  
- Los usuarios se crean y gestionan directamente en Auth0 (no desde la app).  
- El cliente **no puede**:
  - crear usuarios  
  - eliminar usuarios  
  - restablecer contraseñas  
- **Sesión obligatoria**: cada vez que se recarga o se ingresa a la página, el usuario debe autenticarse nuevamente.
- Enfoque orientado a la **protección de datos sensibles**.

---

## Gestión de datos (Supabase)

Después de autenticarse correctamente:

1. La aplicación consulta Supabase.
2. Se cargan los registros de la base de datos.
3. Cada registro contiene:
   - Pregunta  
   - Solución (opcional)  
   - Link (opcional)  
   - Imagen(opcional)  
   - Categoría  

---

## Cards de conocimiento

La información se muestra en contenedores tipo **cards**, donde el usuario puede visualizar rápidamente:

- Categoría  
- Pregunta  
- Solución  
- Enlace relacionado o imagen 

---

##  Sistema de filtrado

La aplicación incluye un **navbar de categorías** que permite:

- Filtrar contenido por categoría  
- Navegar de forma más rápida  
- Mejorar la experiencia de búsqueda

---

## Formulario de sugerencias

Se implementó un formulario para que los usuarios puedan proponer nuevas soluciones.

## Flujo del formulario

1. El usuario envía una sugerencia.
2. La información se guarda en Supabase (tabla de sugerencias).
3. El administrador revisa manualmente.
4. Si es válida, se incorpora a la base oficial de preguntas y soluciones.

Esto permite crecimiento controlado del conocimiento.

---

## Enfoque de seguridad

El proyecto prioriza la seguridad mediante:

- Autenticación obligatoria en cada acceso  
- Gestión de usuarios centralizada en Auth0  
- Acceso restringido a la base de datos  
- Validación manual de nuevas soluciones  

---


## 👨‍💻 Autor

**Juan Marin**
