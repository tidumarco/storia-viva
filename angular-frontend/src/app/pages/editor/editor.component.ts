import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';
import { Speaker, GenerateResponse } from '../../models/story.model';

interface VoiceOption {
  id: string;
  label: string;
  gender: string;
}

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
          rows="16"
          [(ngModel)]="text"
          (ngModelChange)="onTextChange()"
          placeholder="Scrivi la storia in italiano.&#10;&#10;Usa i nomi dei personaggi seguiti da due punti:&#10;&#10;Piergiorgio: Ciao nonna, ho bisogno di un favore.&#10;Nonna: Che tipo di favore?&#10;&#10;Il narratore viene usato per tutto il resto."
        ></textarea>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>

      <aside class="speakers-panel">
        <div class="panel-header">
          <h3>Personaggi e voci</h3>
          <button class="ghost small" (click)="addSpeaker()">+ Aggiungi</button>
        </div>

        <p class="hint">
          Assegna una voce a ogni personaggio. Il narratore è sempre presente.
        </p>

        @for (sp of speakers(); track sp.id; let i = $index) {
          <div class="speaker-item">
            <div class="avatar">{{ sp.id === 'narratore' ? '🎙️' : '👤' }}</div>
            <div class="info">
              @if (sp.id === 'narratore') {
                <strong>Narratore</strong>
              } @else {
                <input
                  type="text"
                  class="name-input"
                  [(ngModel)]="sp.name"
                  (ngModelChange)="updateSpeakerId(sp)"
                  placeholder="Nome personaggio"
                />
              }
              <select [(ngModel)]="sp.voice_id">
                @for (v of voices; track v.id) {
                  <option [value]="v.id">{{ v.label }}</option>
                }
              </select>
            </div>
            @if (sp.id !== 'narratore') {
              <button class="remove-btn" (click)="removeSpeaker(i)" title="Rimuovi">×</button>
            }
          </div>
        }

        @if (speakers().length === 1) {
          <p class="hint" style="margin-top: 12px;">
            Aggiungi personaggi o scrivi nel testo nomi seguiti da «:» per rilevarli automaticamente.
          </p>
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
      grid-template-columns: 1fr 320px;
      gap: 28px;
    }

    textarea {
      resize: vertical;
      min-height: 320px;
    }

    .speakers-panel {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 20px;
      border: 1px solid var(--surface-2);
      height: fit-content;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .panel-header h3 {
      font-size: 1rem;
    }

    .hint {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .speaker-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 12px 12px 12px;
      background: var(--surface-2);
      border-radius: 12px;
      margin-bottom: 10px;
      position: relative;
    }

    .speaker-item .avatar {
      font-size: 1.4rem;
      margin-top: 4px;
    }

    .speaker-item .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .speaker-item .info strong {
      font-size: 0.9rem;
    }

    .name-input {
      background: var(--bg);
      border: 1px solid var(--surface);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.9rem;
      color: var(--text);
      width: 100%;
    }

    .speaker-item select {
      background: var(--bg);
      border: 1px solid var(--surface);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.85rem;
      color: var(--text);
      width: 100%;
    }

    .remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: none;
      color: var(--muted);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 2px 6px;
      line-height: 1;
      border-radius: 6px;
    }

    .remove-btn:hover {
      color: #ff5c7a;
      background: rgba(255, 92, 122, 0.1);
    }

    button.small {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    .error {
      color: #ff5c7a;
      margin-top: 12px;
      font-size: 0.9rem;
    }

    @media (max-width: 800px) {
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

  speakers = signal<Speaker[]>([
    { id: 'narratore', name: 'Narratore', voice_id: 'orion' }
  ]);

  voices: VoiceOption[] = [
    { id: 'orion', label: 'Orion — maschile chiaro', gender: 'male' },
    { id: 'leo', label: 'Leo — maschile giovane', gender: 'male' },
    { id: 'atlas', label: 'Atlas — maschile', gender: 'male' },
    { id: 'ursa', label: 'Ursa — femminile', gender: 'female' },
    { id: 'ara', label: 'Ara — femminile', gender: 'female' },
    { id: 'luna', label: 'Luna — femminile', gender: 'female' },
    { id: 'aurora', label: 'Aurora — femminile', gender: 'female' }
  ];

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

  onTextChange() {
    this.autoDetectSpeakers();
  }

  private autoDetectSpeakers() {
    const text = this.text || '';
    const current = this.speakers();
    const existingIds = new Set(current.map(s => s.id));

    // Detect "Name:" patterns
    const matches = text.match(/^([A-ZÀ-Ú][A-Za-zà-úÀ-Ú\s]{1,30})\s*[:—–-]/gm) || [];
    let added = false;

    for (const raw of matches) {
      const name = raw.replace(/[:—–-].*$/, '').trim();
      const id = name.toLowerCase().replace(/\s+/g, '-');
      if (id && id !== 'narratore' && !existingIds.has(id)) {
        current.push({
          id,
          name,
          voice_id: this.pickDefaultVoice(current.length)
        });
        existingIds.add(id);
        added = true;
      }
    }

    if (added) {
      this.speakers.set([...current]);
    }
  }

  private pickDefaultVoice(index: number): string {
    const defaults = ['leo', 'ursa', 'ara', 'atlas', 'luna', 'aurora'];
    return defaults[index % defaults.length] || 'ara';
  }

  addSpeaker() {
    const list = this.speakers();
    const newId = `personaggio-${list.length}`;
    list.push({
      id: newId,
      name: '',
      voice_id: this.pickDefaultVoice(list.length)
    });
    this.speakers.set([...list]);
  }

  removeSpeaker(index: number) {
    const list = this.speakers();
    if (list[index]?.id === 'narratore') return;
    list.splice(index, 1);
    this.speakers.set([...list]);
  }

  updateSpeakerId(sp: Speaker) {
    if (sp.name) {
      sp.id = sp.name.toLowerCase().trim().replace(/\s+/g, '-');
    }
  }

  generate() {
    if (!this.canGenerate() || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    // Clean speakers: only those with a name
    const cleanSpeakers = this.speakers()
      .filter(s => s.id === 'narratore' || s.name.trim().length > 0)
      .map(s => ({
        id: s.id,
        name: s.name || 'Narratore',
        voice_id: s.voice_id
      }));

    this.storyService
      .generate({
        title: this.title || 'Senza titolo',
        text: this.text,
        speakers: cleanSpeakers,
        language: 'it'
      })
      .subscribe({
        next: (res: GenerateResponse) => {
          this.loading.set(false);
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
