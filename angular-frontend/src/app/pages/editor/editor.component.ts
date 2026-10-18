import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';
import { Speaker, GenerateResponse } from '../../models/story.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <header class="top-bar">
      <a routerLink="/" class="ghost-btn">← Home</a>
      <h2>{{ categoryLabel() }}</h2>
      <button
        class="primary"
        [disabled]="!canGenerate() || loading()"
        (click)="generate()"
      >
        {{ loading() ? 'Generazione…' : 'Genera storia viva' }}
      </button>
    </header>

    <div class="editor-layout">
      <div class="editor-main">
        <label>Titolo</label>
        <input
          type="text"
          [(ngModel)]="title"
          placeholder="Es. La pensione della nonna"
        />

        <label>Testo del racconto</label>
        <textarea
          rows="14"
          [(ngModel)]="text"
          placeholder="Scrivi qui la storia in italiano…&#10;&#10;Esempio:&#10;Piergiorgio va dalla nonna.&#10;&#10;Piergiorgio: Dai nonna, è solo per un po'…&#10;&#10;Nonna: Tu pensi che io sia scema?"
        ></textarea>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>

      <aside class="speakers-panel">
        <h3>Voci</h3>
        <p class="hint">
          Il backend rileva automaticamente i personaggi. Puoi sovrascrivere le voci dopo la generazione.
        </p>

        @for (sp of detectedSpeakers(); track sp.id) {
          <div class="speaker-item">
            <div class="avatar">{{ sp.id === 'narratore' ? '🎙️' : '👤' }}</div>
            <div class="info">
              <strong>{{ sp.name }}</strong>
              <span>voce: {{ sp.voice_id }}</span>
            </div>
          </div>
        } @empty {
          <p class="hint">Scrivi del testo per vedere le voci rilevate.</p>
        }
      </aside>
    </div>
  `,
  styles: [`
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 16px;
    }

    .top-bar h2 {
      flex: 1;
      text-align: center;
      font-size: 1.3rem;
    }

    .ghost-btn {
      color: var(--muted);
      text-decoration: none;
      border: 1px solid var(--surface-2);
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .ghost-btn:hover {
      color: var(--text);
    }

    .editor-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 28px;
    }

    textarea {
      resize: vertical;
      min-height: 280px;
    }

    .speakers-panel {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 20px;
      border: 1px solid var(--surface-2);
      height: fit-content;
    }

    .speakers-panel h3 {
      margin-bottom: 8px;
    }

    .hint {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 16px;
    }

    .speaker-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: var(--surface-2);
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .speaker-item .avatar {
      font-size: 1.4rem;
    }

    .speaker-item .info strong {
      display: block;
      font-size: 0.9rem;
    }

    .speaker-item .info span {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .error {
      color: #ff5c7a;
      margin-top: 12px;
      font-size: 0.9rem;
    }

    @media (max-width: 720px) {
      .editor-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storyService = inject(StoryService);

  category = signal('inediti');
  title = '';
  text = '';
  loading = signal(false);
  error = signal<string | null>(null);
  detectedSpeakers = signal<Speaker[]>([]);

  categoryLabel = () =>
    this.category() === 'fanfiction' ? 'Nuova fanfiction' : 'Nuovo racconto inedito';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.category.set(params.get('category') || 'inediti');
    });
  }

  canGenerate(): boolean {
    return this.text.trim().length >= 10;
  }

  generate() {
    if (!this.canGenerate() || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.storyService
      .generate({
        title: this.title || 'Senza titolo',
        text: this.text,
        language: 'it'
      })
      .subscribe({
        next: (res: GenerateResponse) => {
          this.loading.set(false);
          // Store result in sessionStorage so Player can read it
          sessionStorage.setItem('currentStory', JSON.stringify(res));
          this.router.navigate(['/player']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            err?.error?.error ||
              'Errore durante la generazione. Verifica che il backend sia avviato su :3001'
          );
        }
      });
  }
}
