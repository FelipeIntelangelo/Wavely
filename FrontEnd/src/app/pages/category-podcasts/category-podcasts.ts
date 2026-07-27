import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { Category } from '../../models/enums/category.enum';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

@Component({
  selector: 'app-category-podcasts',
  standalone: true,
  imports: [CommonModule, MediaImageComponent],
  templateUrl: './category-podcasts.html',
  styleUrls: ['./category-podcasts.css']
})
export class CategoryPodcasts implements OnInit {
  category = '';
  podcasts: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private podcastService: PodcastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.category = params['category'] || '';
      this.loadPodcasts();
    });
  }

  loadPodcasts(): void {
    this.isLoading = true;
    this.podcastService.getAllFiltered(undefined, undefined, this.category, false, 0, 100).subscribe({
      next: (pageResponse) => {
        const data = pageResponse.content;
        // Backend may return all podcasts when none match the category.
        // As a defensive measure, filter client-side to only include podcasts
        // that explicitly list the requested category.
        const requested = (this.category || '').toString().toUpperCase();
        const validCategory = Object.values(Category).map(v => v.toString().toUpperCase()).includes(requested);

        if (requested && validCategory) {
          // If the server returned category info on the items, filter client-side.
          const hasCategoriesField = (data || []).some((p: any) => p && Object.prototype.hasOwnProperty.call(p, 'categories'));

          if (hasCategoriesField) {
            const filtered = (data || []).filter((p: any) => {
              const cats = (p.categories || []) as any[];
              return cats.some(c => (c || '').toString().toUpperCase() === requested);
            });
            this.podcasts = filtered;
            this.isLoading = false;
          } else {
            // Server didn't include categories. The server may have already filtered,
            // or it may have returned all items without category info. To be safe,
            // fetch full podcast objects for each returned id and then filter by categories.
            const ids = (data || []).map((p: any) => p.id).filter((id: any) => id != null);
            if (ids.length === 0) {
              this.podcasts = [];
              this.isLoading = false;
            } else {
              const requests = ids.map(id => this.podcastService.getPodcastById(id).pipe(
                catchError(() => of(null))
              ));
              forkJoin(requests).subscribe((fulls: any[]) => {
                const filtered = (fulls || []).filter(f => f && Array.isArray(f.categories) && f.categories.some((c: any) => (c || '').toString().toUpperCase() === requested));
                this.podcasts = filtered;
                this.isLoading = false;
              }, (err) => {
                console.error('Error fetching full podcast objects for category filtering', err);
                // As a last resort, fall back to server response
                this.podcasts = data;
                this.isLoading = false;
              });
            }
          }
        } else {
          // If category is empty or invalid, fallback to server response (could be all)
          this.podcasts = data;
          this.isLoading = false;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading podcasts for category', this.category, err);
        this.isLoading = false;
      }
    });
  }

  viewPodcast(id: number): void {
    this.router.navigate(['/podcast', id]);
  }
}
