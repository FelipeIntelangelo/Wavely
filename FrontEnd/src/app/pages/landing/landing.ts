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
}

interface RoleTier {
  id: string;
  title: string;
  description: string;
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
      category: 'Backend',
      version: 'Java 21 LTS',
      description: 'API RESTful modular con Spring Data JPA y manejo global de excepciones.'
    },
    {
      title: 'MySQL & Docker',
      category: 'Persistencia',
      version: 'Hibernate / JPA',
      description: 'Modelo relacional con soporte de soft-delete híbrido y consultas nativas SQL.'
    },
    {
      title: 'Seguridad & RBAC',
      category: 'Autenticación',
      version: 'Spring Security',
      description: 'Autenticación dual con JWT local y Google OAuth 2.0.'
    },
    {
      title: 'Angular 20',
      category: 'Frontend',
      version: 'SPA & RxJS',
      description: 'Arquitectura Standalone reactiva con streaming de audio continuo.'
    },
    {
      title: 'WebSockets & STOMP',
      category: 'Tiempo Real',
      version: 'Broker Push',
      description: 'Canal de mensajería bidireccional para despacho instantáneo de notificaciones.'
    },
    {
      title: 'Cloudinary CDN',
      category: 'Multimedia',
      version: 'Cloud Media',
      description: 'Almacenamiento y distribución en la nube de audios MP3 y portadas.'
    }
  ];

  roles: RoleTier[] = [
    {
      id: 'visitor',
      title: 'Visitante',
      description: 'Exploración, catálogo público y streaming libre sin autenticación previa.'
    },
    {
      id: 'user',
      title: 'Usuario',
      description: 'Personalización, favoritos, playlists privadas, historial y comentarios.'
    },
    {
      id: 'creator',
      title: 'Creador',
      description: 'Creación de canales, subida de audios MP3 y métricas de audiencia.'
    },
    {
      id: 'admin',
      title: 'Administrador',
      description: 'Superpoderes de moderación in-situ con override global sobre recursos.'
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
