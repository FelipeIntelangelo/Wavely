# Wavely

Wavely es una plataforma web para descubrir, reproducir, crear y gestionar podcasts y episodios multimedia. Permite explorar contenido, interactuar mediante favoritos, comentarios y calificaciones, crear listas de reproducción y seguir a otros creadores.

## Objetivo del proyecto

Ofrecer una experiencia integral para oyentes y creadores, centralizando la publicación, el descubrimiento y la reproducción de podcasts en una aplicación web.

## Tecnologías principales

- **Frontend:** Angular 20, TypeScript y RxJS
- **Backend:** Java 21, Spring Boot 3.5 y Spring Security
- **Base de datos:** MySQL
- **Integraciones:** Cloudinary, Google Identity y WebSocket/STOMP
- **Infraestructura:** Docker y Nginx

## Arquitectura general

El proyecto utiliza una arquitectura cliente-servidor. El frontend es una SPA desarrollada con Angular que consume la API REST del backend Spring Boot. La persistencia se realiza mediante JPA sobre MySQL, Cloudinary administra los archivos multimedia y WebSocket/STOMP entrega notificaciones en tiempo real.

## Ejecución del proyecto

Con Docker instalado y la instancia MySQL configurada en `docker-compose.yml` accesible, ejecutá desde la raíz:

```bash
docker compose up --build
```

La aplicación queda disponible en `http://localhost` y el backend en `http://localhost:8080`.

Para ejecutar cada aplicación por separado, consultá sus instrucciones específicas:

- [README del Backend](BackEnd/README.md)
- [README del Frontend](FrontEnd/README.md)

## Estructura del repositorio

```text
Wavely/
├── BackEnd/              # API REST desarrollada con Spring Boot
├── FrontEnd/             # Aplicación web desarrollada con Angular
├── knowledge/            # Documentación funcional y técnica del proyecto
├── docker-compose.yml    # Orquestación de los servicios
├── iniciar-proyecto.bat  # Inicio del entorno en Windows
└── detener-proyecto.bat  # Detención del entorno en Windows
```

## Autores

- Felipe Intelangelo
- Julian Barreiro
- Nahuel Di Costanzo

Proyecto académico para la Universidad Tecnológica Nacional de Mar del Plata (UTNMDP).
