import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../services/ui/alert.service';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { UserService } from '../../services/client/user-service';
import { AuthService } from '../../services/auth/auth.service';
import { PodcastDTO } from '../../models/podcast/podcast-dto';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('novedadesWrapper') novedadesWrapper!: ElementRef<HTMLElement>;
  @ViewChild('masEscuchadosWrapper') masEscuchadosWrapper!: ElementRef<HTMLElement>;
  @ViewChild('mejoresValoradosWrapper') mejoresValoradosWrapper!: ElementRef<HTMLElement>;
  @ViewChild('favoritosWrapper') favoritosWrapper!: ElementRef<HTMLElement>;

  carousels: { [key: string]: CarouselState } = {
    novedades: { hasBeenClicked: false, atStart: true, atEnd: false },
    masEscuchados: { hasBeenClicked: false, atStart: true, atEnd: false },
    mejoresValorados: { hasBeenClicked: false, atStart: true, atEnd: false },
    favoritos: { hasBeenClicked: false, atStart: true, atEnd: false },
  };

  novedadesPodcasts: PodcastForDisplay[] = [];
  masEscuchadosPodcasts: PodcastForDisplay[] = [];
  mejoresValoradosPodcasts: PodcastForDisplay[] = [];
  favoritosPodcasts: PodcastForDisplay[] = [];

  isLoading = {
    novedades: false,
    masEscuchados: false,
    mejoresValorados: false,
    favoritos: false
  };

  isLoggedIn = false;

  constructor(
    private alertService: AlertService,
    private podcastService: PodcastService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Verificar si está logueado
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.loadFavoritos();
      }
    });

    this.loadPodcasts();
  }

  loadPodcasts(): void {
    this.loadNovedades();
    this.loadMasEscuchados();
    this.loadMejoresValorados();
  }

  loadNovedades(): void {
    this.isLoading.novedades = true;
    this.podcastService.getAll(false).subscribe({
      next: (podcasts) => {
        this.novedadesPodcasts = this.sortPodcastsByDate(podcasts as PodcastWithDate[]);
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
    this.podcastService.getAll(true).subscribe({
      next: (podcasts) => {
        this.masEscuchadosPodcasts = this.sortPodcastsByViews(podcasts);
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
    this.podcastService.getAll(false).subscribe({
      next: (podcasts) => {
        this.mejoresValoradosPodcasts = this.sortPodcastsByRating(podcasts as PodcastWithDate[]);
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
      { key: 'novedades', ref: this.novedadesWrapper },
      { key: 'masEscuchados', ref: this.masEscuchadosWrapper },
      { key: 'mejoresValorados', ref: this.mejoresValoradosWrapper },
      { key: 'favoritos', ref: this.favoritosWrapper }
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
      { key: 'novedades', ref: this.novedadesWrapper },
      { key: 'masEscuchados', ref: this.masEscuchadosWrapper },
      { key: 'mejoresValorados', ref: this.mejoresValoradosWrapper },
      { key: 'favoritos', ref: this.favoritosWrapper }
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
      element.scrollLeft += scrollAmount;
    }
  }

  goBack(carouselKey: string): void {
    const element = this.getWrapperElement(carouselKey);
    if (element) {
      const scrollAmount = element.clientWidth * 0.8;
      element.scrollLeft -= scrollAmount;
    }
  }

  private getWrapperElement(key: string): HTMLElement | null {
    const wrapperMap: { [key: string]: ElementRef<HTMLElement> | undefined } = {
      'novedades': this.novedadesWrapper,
      'masEscuchados': this.masEscuchadosWrapper,
      'mejoresValorados': this.mejoresValoradosWrapper,
      'favoritos': this.favoritosWrapper
    };

    const wrapper = wrapperMap[key];
    return wrapper ? wrapper.nativeElement : null;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder && placeholder.classList.contains('image-placeholder-home')) {
      placeholder.style.display = 'flex';
    }
  }
}
