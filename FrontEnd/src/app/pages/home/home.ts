import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../services/ui/alert.service';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { UserService } from '../../services/client/user-service';
import { AuthService } from '../../services/auth/auth.service';
import { PodcastDTO } from '../../models/podcast/podcast-dto';
import { RecommendationService } from '../../services/recommendation/recommendation-service';
import { RecommendationDTO } from '../../models/recommendation/recommendation-dto';
import { RecommendationStrategy } from '../../models/enums/recommendation-strategy.enum';
import { DiceRollerComponent } from '../../components/shared/dice-roller/dice-roller';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

import { UserSearchDTO } from '../../models/user/userSearchDTO';

interface CarouselState {
  hasBeenClicked: boolean;
  atStart: boolean;
  atEnd: boolean;
}

interface PodcastWithDate extends PodcastSearchDTO {
  createdAt: string;
  averageRating?: number;
}

interface PodcastForDisplay {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DiceRollerComponent, MediaImageComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('recomendacionesWrapper') recomendacionesWrapper!: ElementRef<HTMLElement>;
  @ViewChild('novedadesWrapper') novedadesWrapper!: ElementRef<HTMLElement>;
  @ViewChild('masEscuchadosWrapper') masEscuchadosWrapper!: ElementRef<HTMLElement>;
  @ViewChild('mejoresValoradosWrapper') mejoresValoradosWrapper!: ElementRef<HTMLElement>;
  @ViewChild('favoritosWrapper') favoritosWrapper!: ElementRef<HTMLElement>;
  @ViewChild('creadoresWrapper') creadoresWrapper!: ElementRef<HTMLElement>;

  carousels: { [key: string]: CarouselState } = {
    recomendaciones: { hasBeenClicked: false, atStart: true, atEnd: false },
    novedades: { hasBeenClicked: false, atStart: true, atEnd: false },
    masEscuchados: { hasBeenClicked: false, atStart: true, atEnd: false },
    mejoresValorados: { hasBeenClicked: false, atStart: true, atEnd: false },
    favoritos: { hasBeenClicked: false, atStart: true, atEnd: false },
    creadoresDestacados: { hasBeenClicked: false, atStart: true, atEnd: false },
  };

  recomendacionesPodcasts: PodcastForDisplay[] = [];
  recomendacionStrategyText: string = 'Recomendaciones para ti';
  novedadesPodcasts: PodcastForDisplay[] = [];
  masEscuchadosPodcasts: PodcastForDisplay[] = [];
  mejoresValoradosPodcasts: PodcastForDisplay[] = [];
  favoritosPodcasts: PodcastForDisplay[] = [];
  creadoresDestacados: UserSearchDTO[] = [];

  isLoading = {
    recomendaciones: false,
    novedades: false,
    masEscuchados: false,
    mejoresValorados: false,
    favoritos: false,
    creadoresDestacados: false
  };

  isLoggedIn = false;

  constructor(
    private alertService: AlertService,
    private podcastService: PodcastService,
    private userService: UserService,
    private authService: AuthService,
    private recommendationService: RecommendationService
  ) { }

  ngOnInit(): void {
    // Verificar si está logueado
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.loadFavoritos();
      }
      // Cargamos recomendaciones solo después de saber si está logueado o no
      this.loadRecomendaciones();
    });

    this.loadPodcasts();
  }

  loadPodcasts(): void {
    this.loadNovedades();
    this.loadMasEscuchados();
    this.loadMejoresValorados();
    this.loadCreadoresDestacados();
  }

  loadCreadoresDestacados(): void {
    this.isLoading.creadoresDestacados = true;
    this.userService.getFeaturedCreators(10).subscribe({
      next: (creadores) => {
        this.creadoresDestacados = creadores;
        this.isLoading.creadoresDestacados = false;
        setTimeout(() => {
          if (this.creadoresWrapper) {
            this.handleScroll('creadoresDestacados', this.creadoresWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading creadores destacados:', error);
        this.isLoading.creadoresDestacados = false;
      }
    });
  }

  loadRecomendaciones(): void {
    this.isLoading.recomendaciones = true;
    const request = this.isLoggedIn 
      ? this.recommendationService.getPersonalized() 
      : this.recommendationService.getTrending();
      
    request.subscribe({
      next: (recommendations: RecommendationDTO[]) => {
        this.recomendacionesPodcasts = recommendations.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrl: r.imageUrl
        }));
        
        if (recommendations.length > 0) {
          const strategyTitles: Record<RecommendationStrategy, string> = {
            [RecommendationStrategy.TRENDING]: 'Tendencias globales',
            [RecommendationStrategy.CONTENT_BASED]: 'Porque te gustan estas categorías',
            [RecommendationStrategy.COLLABORATIVE]: 'Recomendados para ti',
            [RecommendationStrategy.RANDOM_DICE]: 'Recomendaciones para ti'
          };
          this.recomendacionStrategyText = strategyTitles[recommendations[0].strategy] || 'Recomendaciones para ti';
        }

        this.isLoading.recomendaciones = false;
        setTimeout(() => {
          if (this.recomendacionesWrapper) {
            this.handleScroll('recomendaciones', this.recomendacionesWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading recomendaciones:', error);
        this.isLoading.recomendaciones = false;
      }
    });
  }

  loadNovedades(): void {
    this.isLoading.novedades = true;
    this.podcastService.getAll(0, 10, false).subscribe({
      next: (pageResponse) => {
        this.novedadesPodcasts = this.sortPodcastsByDate(pageResponse.content as PodcastWithDate[]);
        this.isLoading.novedades = false;
        setTimeout(() => {
          if (this.novedadesWrapper) {
            this.handleScroll('novedades', this.novedadesWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading novedades:', error);
        this.isLoading.novedades = false;
      }
    });
  }

  loadMasEscuchados(): void {
    this.isLoading.masEscuchados = true;
    this.podcastService.getAll(0, 10, true).subscribe({
      next: (pageResponse) => {
        this.masEscuchadosPodcasts = this.sortPodcastsByViews(pageResponse.content);
        this.isLoading.masEscuchados = false;
        setTimeout(() => {
          if (this.masEscuchadosWrapper) {
            this.handleScroll('masEscuchados', this.masEscuchadosWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading mas escuchados:', error);
        this.isLoading.masEscuchados = false;
      }
    });
  }

  loadMejoresValorados(): void {
    this.isLoading.mejoresValorados = true;
    this.podcastService.getAll(0, 10, false).subscribe({
      next: (pageResponse) => {
        this.mejoresValoradosPodcasts = this.sortPodcastsByRating(pageResponse.content as PodcastWithDate[]);
        this.isLoading.mejoresValorados = false;
        setTimeout(() => {
          if (this.mejoresValoradosWrapper) {
            this.handleScroll('mejoresValorados', this.mejoresValoradosWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading mejores valorados:', error);
        this.isLoading.mejoresValorados = false;
      }
    });
  }

  loadFavoritos(): void {
    this.isLoading.favoritos = true;
    this.userService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.favoritosPodcasts = favorites.map(fav => ({
          id: fav.id,
          title: fav.title,
          description: fav.description,
          imageUrl: fav.imageUrl
        }));
        this.isLoading.favoritos = false;
        setTimeout(() => {
          if (this.favoritosWrapper) {
            this.handleScroll('favoritos', this.favoritosWrapper.nativeElement);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading favoritos:', error);
        // No mostrar error si no está logueado, solo si hay un error real
        if (this.isLoggedIn) {
          this.alertService.error('Error', 'Error al cargar los favoritos');
        }
        this.isLoading.favoritos = false;
      }
    });
  }

  private sortPodcastsByDate(podcasts: PodcastWithDate[]): PodcastForDisplay[] {
    return [...podcasts]
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl
      }));
  }

  private sortPodcastsByViews(podcasts: PodcastSearchDTO[]): PodcastForDisplay[] {
    return [...podcasts]
      .sort((a, b) => b.averageViews - a.averageViews)
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl
      }));
  }

  private sortPodcastsByRating(podcasts: PodcastWithDate[]): PodcastForDisplay[] {
    return [...podcasts]
      .filter(p => p.averageRating !== undefined && p.averageRating !== null)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl
      }));
  }

  ngAfterViewInit(): void {
    const wrappers = [
      { key: 'recomendaciones', ref: this.recomendacionesWrapper },
      { key: 'novedades', ref: this.novedadesWrapper },
      { key: 'masEscuchados', ref: this.masEscuchadosWrapper },
      { key: 'mejoresValorados', ref: this.mejoresValoradosWrapper },
      { key: 'favoritos', ref: this.favoritosWrapper },
      { key: 'creadoresDestacados', ref: this.creadoresWrapper }
    ];

    wrappers.forEach(({ key, ref }) => {
      if (ref) {
        this.handleScroll(key, ref.nativeElement);
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    const wrappers = [
      { key: 'recomendaciones', ref: this.recomendacionesWrapper },
      { key: 'novedades', ref: this.novedadesWrapper },
      { key: 'masEscuchados', ref: this.masEscuchadosWrapper },
      { key: 'mejoresValorados', ref: this.mejoresValoradosWrapper },
      { key: 'favoritos', ref: this.favoritosWrapper },
      { key: 'creadoresDestacados', ref: this.creadoresWrapper }
    ];

    wrappers.forEach(({ key, ref }) => {
      if (ref) {
        this.handleScroll(key, ref.nativeElement);
      }
    });
  }

  handleScroll(carouselKey: string, element: HTMLElement): void {
    if (!element) return;
    const carousel = this.carousels[carouselKey];
    if (!carousel) return;

    const tolerance = 5;
    carousel.atStart = element.scrollLeft <= tolerance;
    carousel.atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - tolerance;
  }

  onArrowClick(carouselKey: string): void {
    this.carousels[carouselKey].hasBeenClicked = true;
    this.goNext(carouselKey);
  }

  goNext(carouselKey: string): void {
    const element = this.getWrapperElement(carouselKey);
    if (element) {
      const scrollAmount = element.clientWidth * 0.8;
      this.smoothScrollBy(element, scrollAmount, 400);
    }
  }

  goBack(carouselKey: string): void {
    const element = this.getWrapperElement(carouselKey);
    if (element) {
      const scrollAmount = element.clientWidth * 0.8;
      this.smoothScrollBy(element, -scrollAmount, 400);
    }
  }

  private smoothScrollBy(element: HTMLElement, distance: number, duration: number): void {
    const start = element.scrollLeft;
    const startTime = performance.now();
    
    // Desactivar scroll-snap temporalmente para que no interrumpa la animación
    element.style.scrollSnapType = 'none';

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Función de aceleración (easeInOutQuad)
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      element.scrollLeft = start + distance * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        // Restaurar scroll-snap al terminar para que se ajuste a la tarjeta más cercana
        element.style.scrollSnapType = '';
      }
    };

    requestAnimationFrame(animateScroll);
  }

  private getWrapperElement(key: string): HTMLElement | null {
    const wrapperMap: { [key: string]: ElementRef<HTMLElement> | undefined } = {
      'recomendaciones': this.recomendacionesWrapper,
      'novedades': this.novedadesWrapper,
      'masEscuchados': this.masEscuchadosWrapper,
      'mejoresValorados': this.mejoresValoradosWrapper,
      'favoritos': this.favoritosWrapper,
      'creadoresDestacados': this.creadoresWrapper
    };

    const wrapper = wrapperMap[key];
    return wrapper ? wrapper.nativeElement : null;
  }
}
