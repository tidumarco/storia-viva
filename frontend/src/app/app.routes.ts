import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EditorComponent } from './pages/editor/editor.component';
import { PlayerComponent } from './pages/player/player.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'editor/:category', component: EditorComponent },
  { path: 'player', component: PlayerComponent },
  { path: '**', redirectTo: '' }
];
