import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="app-nav">
      <a routerLink="/workspace" routerLinkActive="active">Workspace</a>
      <a routerLink="/perf" routerLinkActive="active">Perf</a>
      <a routerLink="/job" routerLinkActive="active">Job</a>
    </nav>
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    .app-nav { display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #ddd; }
    .app-nav a.active { font-weight: bold; }
    main { padding: 1rem; }
  `,
})
export class AppComponent {}
