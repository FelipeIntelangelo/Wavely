import { Component, AfterViewInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WaveArcsComponent } from '../../components/landing/wave-arcs/wave-arcs';
import { SlideFillButtonComponent } from '../../components/landing/slide-fill-button/slide-fill-button';
import { MemberCarouselComponent, CarouselMember } from '../../components/landing/member-carousel/member-carousel';

interface TechCard {
  title: string;
  category: string;
  version: string;
  description: string;
  highlights: string[];
}

interface RoleTier {
  id: string;
  title: string;
  badge: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    WaveArcsComponent,
    SlideFillButtonComponent,
    MemberCarouselComponent
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  activeSection = 'hero';

  teamMembers: CarouselMember[] = [
    {
      name: 'Felipe Intelangelo',
      role: 'Desarrollo & Arquitectura',
      image: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788153729/unnamed_yvnery.jpg',
      buttonImage: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788153729/unnamed_yvnery.jpg'
    },
    {
      name: 'Julián Barreiro',
      role: 'Desarrollo & Backend',
      image: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788154067/1766770507081_z2asrp.jpg',
      buttonImage: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788154067/1766770507081_z2asrp.jpg'
    },
    {
      name: 'Nahuel Di Costanzo',
      role: 'Desarrollo & Frontend',
      image: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788153893/1679140374158_lqzcgp.jpg',
      buttonImage: 'https://res.cloudinary.com/dusesgecs/image/upload/v1788153893/1679140374158_lqzcgp.jpg'
    }
  ];

  techStack: TechCard[] = [
    {
      title: 'Spring Boot 3.5',
      category: 'Backend Core',
      version: 'Java 21 LTS',
      description: 'API RESTful estructurada con Spring Data JPA, Hibernate, manejo centralizado de excepciones y catálogo de ErrorCodes declarativos.',
      highlights: ['Arquitectura modular en capas', 'Autenticación Stateless JWT', 'GlobalExceptionHandler tipado']
    },
    {
      title: 'Angular 20',
      category: 'Frontend SPA',
      version: 'TypeScript & RxJS',
      description: 'Single Page Application con arquitectura basada en componentes Standalone, gestión reactiva con RxJS y reproductor desacoplado.',
      highlights: ['Audio Streaming continuo en SPA', 'Gestión reactiva de estado', 'Componentes Standalone puros']
    },
    {
      title: 'MySQL & Hibernate',
      category: 'Persistencia Relacional',
      version: 'Spring Data JPA',
      description: 'Modelo relacional gestionado por el ORM de Spring Boot con Hibernate, soporte de soft-delete híbrido y consultas nativas SQL.',
      highlights: ['Mapeo relacional con JPA / ORM', 'Queries nativas optimizadas', 'Soft Delete con anonimización']
    },
    {
      title: 'WebSockets & STOMP',
      category: 'Tiempo Real',
      version: 'Spring STOMP Broker',
      description: 'Canal de mensajería bidireccional sobre WebSockets para la emisión inmediata de notificaciones a suscriptores y seguidores.',
      highlights: ['Destinos privados /queue/notifications', 'Push instantáneo sin polling', 'Sincronización de interfaz']
    },
    {
      title: 'Cloudinary CDN',
      category: 'Almacenamiento Multimedia',
      version: 'Cloud Media API',
      description: 'Infraestructura en la nube para procesamiento, almacenamiento y distribución optimizada de audios MP3 y portadas gráficas.',
      highlights: ['Streaming directo desde CDN', 'Normalización de duraciones ISO 8601', 'Desacoplamiento de binarios']
    },
    {
      title: 'Seguridad & RBAC',
      category: 'Autenticación',
      version: 'Spring Security 6',
      description: 'Esquema de autenticación dual con credenciales locales y Google OAuth 2.0, administrado mediante Role-Based Access Control.',
      highlights: ['Google Sign-In OAuth 2.0', 'Filtro JwtAuthFilter stateless', 'Control de acceso jerárquico']
    }
  ];

  roles: RoleTier[] = [
    {
      id: 'visitor',
      title: 'Visitante / Invitado',
      badge: 'Nivel 1',
      description: 'Consumo libre sin autenticación previa. Descubrimiento, streaming continuo y exploración completa del catálogo.',
      features: [
        'Acceso al catálogo público y tendencias',
        'Motor de búsqueda global en tiempo real',
        'Reproductor multimedia persistente sin cortes',
        'Exploración por taxonomía de categorías'
      ]
    },
    {
      id: 'user',
      title: 'Usuario Registrado',
      badge: 'Nivel 2',
      description: 'Desbloqueo de personalización, almacenamiento privado e interacción social con la comunidad de creadores.',
      features: [
        'Gestión de Favoritos y suscripciones a canales',
        'Historial cronológico de reproducciones',
        'Playlists privadas mixtas con Drag & Drop',
        'Valoraciones con estrellas y comentarios públicos'
      ]
    },
    {
      id: 'creator',
      title: 'Creador de Contenido',
      badge: 'Nivel 3',
      description: 'Herramientas de autoría y distribución multimedia para la gestión integral de canales de podcasts.',
      features: [
        'Creación y categorización temática de canales',
        'Subida y recorte de imágenes de portada',
        'Publicación de episodios con audio binario',
        'Panel centralizado con métricas de audiencia'
      ]
    },
    {
      id: 'admin',
      title: 'Administrador',
      badge: 'Nivel 4',
      description: 'Superpoderes de moderación in-situ con capacidad de anular restricciones de autoría en toda la plataforma.',
      features: [
        'Override global de permisos sobre recursos (RBAC)',
        'Edición y baja forzada de contenido infractor',
        'Moderación directa sobre las vistas estándar',
        'Gestión y auditoría de integridad de usuarios'
      ]
    }
  ];

  ngAfterViewInit(): void {
    this.initScrollReveal();
  }

  private initScrollReveal(): void {
    const observerOptions = {
      root: this.el.nativeElement,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          const id = entry.target.getAttribute('id');
          if (id) {
            this.activeSection = id;
          }
        }
      });
    }, observerOptions);

    const sections = this.el.nativeElement.querySelectorAll('.reveal-section');
    sections.forEach((section: HTMLElement) => {
      this.observer?.observe(section);
    });
  }

  scrollTo(sectionId: string): void {
    const target = this.el.nativeElement.querySelector(`#${sectionId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
