import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/client/user-service';
import { UserSearchDTO } from '../../models/user/userSearchDTO';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { EpisodeService } from '../../services/episode/episode.service';
import { EpisodeDTO } from '../../models/episode/episode-dto';

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit, OnDestroy, AfterViewInit {
  term: string = '';
  currentTab: string = 'all'; // 'all', 'podcasts', 'episodes', 'users'
  
  isUsersLoading = false;
  isPodcastsLoading = false;
  isEpisodesLoading = false;
  
  error: string | null = null;
  
  filteredUsers: UserSearchDTO[] = [];
  filteredPodcasts: PodcastSearchDTO[] = [];
  filteredEpisodes: EpisodeDTO[] = [];
  
  isOrderedByViews: boolean = false; 
  
  userPage: number = 0;
  userSize: number = 10;
  hasMoreUsers: boolean = true;

  podcastPage: number = 0;
  podcastSize: number = 10;
  hasMorePodcasts: boolean = true;

  episodePage: number = 0;
  episodeSize: number = 10;
  hasMoreEpisodes: boolean = true;

  private sub = new Subscription();
  private observer: IntersectionObserver | null = null;

  @ViewChild('userSentinel') userSentinel!: ElementRef;
  @ViewChild('podcastSentinel') podcastSentinel!: ElementRef;
  @ViewChild('episodeSentinel') episodeSentinel!: ElementRef;

  constructor(
    private route: ActivatedRoute, 
    private userService: UserService,
    private podcastService: PodcastService,
    private episodeService: EpisodeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Escuchar el tab desde los query parameters
    this.sub.add(
      this.route.queryParamMap.subscribe(params => {
        this.currentTab = params.get('tab') || 'all';
        this.resetSearch();
        this.loadContentBasedOnTab();
      })
    );

    this.sub.add(
      this.route.paramMap.subscribe(params => {
        const newTerm = (params.get('term') ?? '').trim();
        if (this.term !== newTerm) {
          this.term = newTerm;
          this.resetSearch();
          this.loadContentBasedOnTab();
        }
      })
    );
  }

  private loadContentBasedOnTab(): void {
    const query = this.term.toLowerCase();
    if (!query) return;

    switch (this.currentTab) {
      case 'all':
        this.userSize = this.podcastSize = this.episodeSize = 6;
        this.loadUsers();
        this.loadPodcasts();
        this.loadEpisodes();
        break;
      case 'podcasts':
        this.podcastSize = 20;
        this.loadPodcasts();
        break;
      case 'episodes':
        this.episodeSize = 20;
        this.loadEpisodes();
        break;
      case 'users':
        this.userSize = 20;
        this.loadUsers();
        break;
    }
  }

  goToTab(tabName: string): void {
    if (tabName === 'all') {
      this.router.navigate(['/search', this.term]);
    } else {
      this.router.navigate(['/search', this.term], { queryParams: { tab: tabName } });
    }
  }

  ngAfterViewInit(): void {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        switch (entry.target.id) {
          case 'user-sentinel':
            if (this.currentTab === 'users' && !this.isUsersLoading && this.hasMoreUsers) {
              this.userPage++;
              this.loadUsers();
            }
            break;
          case 'podcast-sentinel':
            if (this.currentTab === 'podcasts' && !this.isPodcastsLoading && this.hasMorePodcasts) {
              this.podcastPage++;
              this.loadPodcasts();
            }
            break;
          case 'episode-sentinel':
            if (this.currentTab === 'episodes' && !this.isEpisodesLoading && this.hasMoreEpisodes) {
              this.episodePage++;
              this.loadEpisodes();
            }
            break;
        }
      });
    }, options);

    // Initial observe check might be required if ViewChild is available
    this.observeSentinels();
  }

  private observeSentinels() {
    if (!this.observer) return;
    if (this.userSentinel) this.observer.observe(this.userSentinel.nativeElement);
    if (this.podcastSentinel) this.observer.observe(this.podcastSentinel.nativeElement);
    if (this.episodeSentinel) this.observer.observe(this.episodeSentinel.nativeElement);
  }

  private resetSearch(): void {
    this.filteredUsers = [];
    this.filteredPodcasts = [];
    this.filteredEpisodes = [];
    
    this.userPage = 0;
    this.podcastPage = 0;
    this.episodePage = 0;

    this.hasMoreUsers = true;
    this.hasMorePodcasts = true;
    this.hasMoreEpisodes = true;
    
    this.error = null;
  }

  private loadUsers(): void {
    if (!this.hasMoreUsers) return;
    this.isUsersLoading = true;
    this.userService.getUsersDTO(this.term, this.userPage, this.userSize).subscribe({
      next: (pageResponse) => {
        this.filteredUsers = [...this.filteredUsers, ...pageResponse.content];
        this.hasMoreUsers = !pageResponse.last;
        this.isUsersLoading = false;
        setTimeout(() => this.observeSentinels(), 100);
      },
      error: (err) => {
        this.error = err?.message || 'Error al cargar usuarios';
        this.isUsersLoading = false;
      }
    });
  }

  private loadPodcasts(): void {
    if (!this.hasMorePodcasts) return;
    this.isPodcastsLoading = true;
    this.podcastService.getAllFiltered(this.term, undefined, undefined, this.isOrderedByViews, this.podcastPage, this.podcastSize).subscribe({
      next: (pageResponse) => {
        this.filteredPodcasts = [...this.filteredPodcasts, ...pageResponse.content];
        this.hasMorePodcasts = !pageResponse.last;
        this.isPodcastsLoading = false;
        setTimeout(() => this.observeSentinels(), 100);
      },
      error: (err) => {
        this.error = err?.message || 'Error al cargar podcasts';
        this.isPodcastsLoading = false;
      }
    });
  }

  private loadEpisodes(): void {
    if (!this.hasMoreEpisodes) return;
    this.isEpisodesLoading = true;
    this.episodeService.getAll(this.term, undefined, this.episodePage, this.episodeSize).subscribe({
      next: (pageResponse) => {
        this.filteredEpisodes = [...this.filteredEpisodes, ...pageResponse.content];
        this.hasMoreEpisodes = !pageResponse.last;
        this.isEpisodesLoading = false;
        setTimeout(() => this.observeSentinels(), 100);
      },
      error: (err) => {
        this.error = err?.message || 'Error al cargar episodios';
        this.isEpisodesLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  navigateToProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  navigateToPodcast(podcastId: number): void {
    this.router.navigate(['/podcast', podcastId]); 
  }

  get totalResults(): number {
    return this.filteredUsers.length + this.filteredPodcasts.length + this.filteredEpisodes.length;
  }

  get hasResults(): boolean {
    return this.totalResults > 0;
  }

  get isLoading(): boolean {
    return (this.isUsersLoading && this.userPage === 0) || 
           (this.isPodcastsLoading && this.podcastPage === 0) || 
           (this.isEpisodesLoading && this.episodePage === 0);
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return (views || 0).toString();
  }

  toggleSortByViews(): void {
    this.isOrderedByViews = !this.isOrderedByViews;
    if (this.term.trim()) {
      this.filteredPodcasts = [];
      this.podcastPage = 0;
      this.hasMorePodcasts = true;
      this.loadPodcasts();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  onUserImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = img.parentElement;
    if (container) {
      img.remove();
      const placeholder = document.createElement('div');
      placeholder.className = 'user-image-placeholder';
      container.appendChild(placeholder);
    }
  }
}
