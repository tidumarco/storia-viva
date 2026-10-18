import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header>
      <h1>Fai prendere vita alla tua storia</h1>
      <p class="tagline">Scrivi. Assegna le voci. Guarda la storia muoversi.</p>
    </header>

    <div class="categories">
      <a class="cat-card" routerLink="/editor/inediti">
        <span class="cat-icon">✍️</span>
        <h2>Racconti inediti</h2>
        <p>Storie originali</p>
      </a>

      <a class="cat-card" routerLink="/editor/fanfiction">
        <span class="cat-icon">📚</span>
        <h2>Fanfiction</h2>
        <p>Universi esistenti</p>
      </a>
    </div>

    <div class="demo-box">
      <h3>Demo rapida — Piergiorgio &amp; la Nonna</h3>
      <p>Prototipo multi-voce già generato. Vai direttamente al player.</p>
      <a routerLink="/player" [queryParams]="{ demo: true }" class="primary-btn">
        ▶ Avvia demo
      </a>
    </div>
  `,
  styles: [`
    header {
      text-align: center;
      margin-bottom: 48px;
    }

    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }

    .tagline {
      color: var(--muted);
    }

    .categories {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 48px;
    }

    .cat-card {
      background: var(--surface);
      border: 1px solid var(--surface-2);
      border-radius: var(--radius);
      padding: 32px 24px;
      text-align: left;
      color: var(--text);
      text-decoration: none;
      transition: all 0.2s ease;
      display: block;
    }

    .cat-card:hover {
      border-color: var(--accent);
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(124, 92, 255, 0.15);
    }

    .cat-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 12px;
    }

    .cat-card h2 {
      margin-bottom: 4px;
      font-size: 1.3rem;
    }

    .cat-card p {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .demo-box {
      background: linear-gradient(135deg, #1e1a3a, #1a1a24);
      border: 1px solid #3a2f6b;
      border-radius: var(--radius);
      padding: 28px;
      text-align: center;
    }

    .demo-box h3 {
      margin-bottom: 8px;
    }

    .demo-box p {
      color: var(--muted);
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .primary-btn {
      display: inline-block;
      background: var(--accent);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .primary-btn:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }

    @media (max-width: 720px) {
      .categories {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {}
