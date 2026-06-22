import { Routes } from '@angular/router';
import { Register } from './pages/auth/register/register';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Profile } from './pages/profile/profile';
import { Search } from './pages/search/search';
import { EditProfileComponent } from './pages/edit-profile/edit-profile';
import { PodcastDetail } from './pages/podcast-detail/podcast-detail';
import { CreatePodcastComponent } from './pages/create-podcast/create-podcast'; // Import the new component
import { EditPodcastComponent } from './pages/edit-podcast/edit-podcast';
import { ExploreCategories } from './pages/explore-categories/explore-categories';
import { CategoryPodcasts } from './pages/category-podcasts/category-podcasts';
import { MyPodcasts } from './pages/my-podcasts/my-podcasts';
import { EpisodeDetail } from './pages/episode-detail/episode-detail';
import { AddEpisodePage } from './pages/add-episode/add-episode';
import { EditEpisodePage } from './pages/edit-episode/edit-episode';
import { FavoritesComponent } from './pages/favorites/favorites';
import { HistoryComponent } from './pages/history/history';
import { PlaylistsComponent } from './pages/playlists/playlists';

export const routes: Routes = [
    {path: "", component: Home},
    {path: "auth/register", component: Register},
    {path: "auth/login", component: Login},
    {path: "profile/edit", component: EditProfileComponent},
    {path: "profile/:id", component: Profile},
    {path: "profile", component: Profile},
    {path: "search/:term", component: Search},
    {path: "search", component:Search},
    {path: "podcast/:id", component:PodcastDetail},
    {path: "episode/:id", component:EpisodeDetail},
    {path: "episode/:id/edit", component:EditEpisodePage},
    {path: "podcast/:id/add-episode", component: AddEpisodePage},
    {path: "create-podcast", component: CreatePodcastComponent},
    {path: "podcast/:id/edit", component: EditPodcastComponent},
    {path: "explore", component: ExploreCategories},
    {path: "explore/:category", component: CategoryPodcasts},
    {path: "myPodcasts", component: MyPodcasts},
    {path: "favorites", component: FavoritesComponent},
    {path: "history", component: HistoryComponent},
    {path: "playlists", component: PlaylistsComponent}
];
