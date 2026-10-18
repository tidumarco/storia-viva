import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <router-outlet />
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
  `]
})
export class AppComponent {}
