import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';
import { GenerateResponse, TimelineEntry } from '../../models/story.model';

interface DisplaySpeaker {
  id: string;
  name: string;
  emoji: string;
  left?: string;
  right?: string;
  bottom: string;
}

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-bar">
      <a routerLink="/" class="ghost-btn">← Home</a>
      <h2>{{ story()?.title || 'Storia in riproduzione' }}</h2>
      <button class="primary" (click)="togglePlay()">
        {{ isPlaying() ? '⏸ Pausa' : '▶ Play' }}
      </button>
    </header>

    <div class="player-layout">
      <!-- STAGE: characters -->
      <div class="stage">
        <div class="scene-bg" [class.kitchen]="sceneKitchen()"></div>

        @for (sp of displaySpeakers(); track sp.id) {
          <div
            class="character"
            [class.active]="activeSpeaker() === sp.id"
            [style.left]="sp.left || null"
            [style.right]="sp.right || null"
            [style.bottom]="sp.bottom"
          >
            <div class="avatar">{{ sp.emoji }}</div>
            <div class="name">{{ sp.name }}</div>
          </div>
        }
      </div>

      <!-- ANIMATED TEXT PANEL -->
      <div class="text-panel">
        <div class="text-scroll" #textScroll>
          @for (entry of timeline(); track $index; let i = $index) {
            <div
              class="text-line"
              [class.active]="i === currentCueIndex()"
              [class.spoken]="i < currentCueIndex()"
              [class.upcoming]="i > currentCueIndex()"
            >
              <span class="speaker-tag">{{ speakerName(entry.speaker) }}</span>
              <span class="line-text">{{ entry.text }}</span>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls">
      <div class="progress-bar" (click)="seek($event)">
        <div class="progress" [style.width.%]="progress()"></div>
      </div>
      <div class="time-display">
        {{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}
      </div>
    </div>

    <!-- Current spoken line (big subtitle) -->
    <div class="current-subtitle" [class.visible]="!!currentText()">
      <span class="sub-speaker">{{ speakerName(activeSpeaker() || '') }}</span>
      <span class="sub-text">{{ currentText() }}</span>
    </div>

    <audio
      #audioEl
      [src]="audioSrc()"
      (timeupdate)="onTimeUpdate()"
      (loadedmetadata)="onLoaded()"
      (ended)="onEnded()"
      preload="auto"
    ></audio>
  `,
  styles: [`
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 16px;
    }

    .top-bar h2 {
      flex: 1;
      text-align: center;
      font-size: 1.15rem;
    }

    .ghost-btn {
      color: var(--muted);
      text-decoration: none;
      border: 1px solid var(--surface-2);
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .player-layout {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }

    /* STAGE */
    .stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      background: #12121a;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--surface-2);
    }

    .scene-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, #1a1525 0%, #0d0d14 100%);
      transition: background 0.9s ease;
    }

    .scene-bg.kitchen {
      background: linear-gradient(180deg, #2a2218 0%, #1a150f 60%, #0f0c08 100%);
    }

    .character {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
      opacity: 0.3;
      transform: scale(0.88);
    }

    .character.active {
      opacity: 1;
      transform: scale(1.1);
      z-index: 10;
      filter: drop-shadow(0 0 18px rgba(124, 92, 255, 0.35));
    }

    .character .avatar {
      font-size: 3.2rem;
    }

    .character.active .avatar {
      animation: bounce 0.45s ease;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }

    .character .name {
      margin-top: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      background: rgba(0,0,0,0.55);
      padding: 3px 10px;
      border-radius: 20px;
    }

    /* ANIMATED TEXT PANEL */
    .text-panel {
      background: var(--surface);
      border: 1px solid var(--surface-2);
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 420px;
    }

    .text-scroll {
      overflow-y: auto;
      padding: 16px;
      flex: 1;
      scroll-behavior: smooth;
    }

    .text-line {
      padding: 12px 14px;
      border-radius: 12px;
      margin-bottom: 8px;
      transition: all 0.35s ease;
      border-left: 3px solid transparent;
      opacity: 0.45;
    }

    .text-line.spoken {
      opacity: 0.55;
    }

    .text-line.upcoming {
      opacity: 0.35;
    }

    .text-line.active {
      opacity: 1;
      background: rgba(124, 92, 255, 0.12);
      border-left-color: var(--accent);
      transform: translateX(4px);
    }

    .speaker-tag {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .line-text {
      display: block;
      font-size: 0.95rem;
      line-height: 1.45;
    }

    /* CONTROLS */
    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 14px;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--surface-2);
      border-radius: 3px;
      overflow: hidden;
      cursor: pointer;
    }

    .progress {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 0.1s linear;
    }

    .time-display {
      font-size: 0.85rem;
      color: var(--muted);
      min-width: 90px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    /* BIG CURRENT SUBTITLE */
    .current-subtitle {
      text-align: center;
      padding: 16px 20px;
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--surface-2);
      min-height: 72px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .current-subtitle.visible {
      opacity: 1;
    }

    .sub-speaker {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .sub-text {
      font-size: 1.15rem;
      line-height: 1.4;
    }

    @media (max-width: 800px) {
      .player-layout {
        grid-template-columns: 1fr;
      }
      .stage {
        aspect-ratio: 16 / 9;
      }
    }
  `]
})
export class PlayerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);

  @ViewChild('audioEl') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('textScroll') textScrollRef!: ElementRef<HTMLDivElement>;

  story = signal<GenerateResponse | null>(null);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  progress = signal(0);
  activeSpeaker = signal<string | null>(null);
  currentText = signal('');
  currentCueIndex = signal(-1);
  sceneKitchen = signal(false);
  audioSrc = signal('');

  timeline = signal<TimelineEntry[]>([]);

  displaySpeakers = signal<DisplaySpeaker[]>([
    { id: 'narratore',   name: 'Narratore',   emoji: '🎙️', left: '8%',  bottom: '18%' },
    { id: 'piergiorgio', name: 'Piergiorgio', emoji: '👨',  left: '38%', bottom: '12%' },
    { id: 'nonna',       name: 'Nonna',       emoji: '👵',  right: '12%', bottom: '14%' }
  ]);

  private demoTimeline: TimelineEntry[] = [
    { t: 0.0,  speaker: 'narratore',   text: 'Piergiorgio aveva deciso che quella sera sarebbe stata la volta buona. Aveva bisogno di soldi, e sapeva dove trovarli.' },
    { t: 8.5,  speaker: 'piergiorgio', text: 'Dai nonna, è solo per un po\'... te li restituisco, giuro!' },
    { t: 13.2, speaker: 'narratore',   text: 'La nonna lo guardò con gli occhi stretti, la mano ancora chiusa sulla borsa della pensione.' },
    { t: 19.0, speaker: 'nonna',       text: 'Piergiorgio... tu pensi che io sia scema? Quella pensione è tutto quello che ho.' },
    { t: 26.5, speaker: 'piergiorgio', text: 'Ma nonna, è una cosa seria, ti prego...' },
    { t: 30.8, speaker: 'nonna',       text: 'Vai via. E non tornare finché non hai imparato il rispetto.' },
    { t: 36.5, speaker: 'narratore',   text: 'Piergiorgio abbassò lo sguardo. Per la prima volta, aveva perso.' }
  ];

  private speakerNames: Record<string, string> = {
    narratore: 'Narratore',
    piergiorgio: 'Piergiorgio',
    nonna: 'Nonna',
    personaggio: 'Personaggio'
  };

  ngOnInit() {
    const isDemo = this.route.snapshot.queryParamMap.get('demo') === 'true';

    if (isDemo) {
      this.audioSrc.set('/piergiorgio_nonna.mp3');
      this.timeline.set(this.demoTimeline);
      this.story.set({
        id: 'demo',
        title: 'Piergiorgio e la pensione della nonna',
        audioUrl: '/piergiorgio_nonna.mp3',
        timeline: this.demoTimeline,
        speakers: [],
        turns: [],
        durationEstimate: 42,
        language: 'it',
        mode: 'demo'
      });
      return;
    }

    const raw = sessionStorage.getItem('currentStory');
    if (!raw) {
      this.router.navigate(['/']);
      return;
    }

    const data = JSON.parse(raw) as GenerateResponse;
    this.story.set(data);
    this.timeline.set(data.timeline || []);
    this.audioSrc.set(this.storyService.audioUrl(data.audioUrl));

    data.speakers?.forEach(s => {
      this.speakerNames[s.id] = s.name;
    });
  }

  ngOnDestroy() {
    this.pause();
  }

  speakerName(id: string): string {
    return this.speakerNames[id] || id;
  }

  togglePlay() {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;

    if (this.isPlaying()) {
      this.pause();
    } else {
      audio.play();
      this.isPlaying.set(true);
    }
  }

  pause() {
    this.audioRef?.nativeElement?.pause();
    this.isPlaying.set(false);
  }

  onTimeUpdate() {
    const audio = this.audioRef.nativeElement;
    this.currentTime.set(audio.currentTime);
    this.progress.set(
      audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    );

    const tl = this.timeline();
    const t = audio.currentTime;

    let newIndex = -1;
    for (let i = tl.length - 1; i >= 0; i--) {
      if (t >= tl[i].t) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== this.currentCueIndex() && newIndex >= 0) {
      this.currentCueIndex.set(newIndex);
      const entry = tl[newIndex];
      this.activeSpeaker.set(entry.speaker);
      this.currentText.set(entry.text);
      this.sceneKitchen.set(
        entry.speaker === 'nonna' || entry.speaker === 'piergiorgio'
      );

      setTimeout(() => this.scrollToActiveLine(), 50);
    }
  }

  private scrollToActiveLine() {
    const container = this.textScrollRef?.nativeElement;
    if (!container) return;
    const active = container.querySelector('.text-line.active') as HTMLElement;
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onLoaded() {
    this.duration.set(this.audioRef.nativeElement.duration || 0);
  }

  onEnded() {
    this.isPlaying.set(false);
    this.currentCueIndex.set(-1);
  }

  seek(event: MouseEvent) {
    const audio = this.audioRef.nativeElement;
    if (!audio.duration) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
