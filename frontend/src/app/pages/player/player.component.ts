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

    <div class="stage-wrapper">
      <div class="stage">
        <div class="scene-bg" [class.kitchen]="sceneKitchen()"></div>

        @for (sp of displaySpeakers(); track sp.id) {
          <div
            class="character"
            [class.active]="activeSpeaker() === sp.id"
            [style.left]="sp.left"
            [style.right]="sp.right"
            [style.bottom]="sp.bottom"
          >
            <div class="avatar">{{ sp.emoji }}</div>
            <div class="name">{{ sp.name }}</div>
            <div
              class="speech-bubble"
              [class.visible]="activeSpeaker() === sp.id && currentText()"
            >
              {{ bubbleText() }}
            </div>
          </div>
        }
      </div>

      <div class="timeline">
        <div class="progress-bar" (click)="seek($event)">
          <div class="progress" [style.width.%]="progress()"></div>
        </div>
        <div class="time-display">
          {{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}
        </div>
      </div>

      <div class="subtitle">{{ currentText() }}</div>
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
      margin-bottom: 28px;
      gap: 16px;
    }

    .top-bar h2 {
      flex: 1;
      text-align: center;
      font-size: 1.2rem;
    }

    .ghost-btn {
      color: var(--muted);
      text-decoration: none;
      border: 1px solid var(--surface-2);
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .stage-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #12121a;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--surface-2);
    }

    .scene-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, #1a1525 0%, #0d0d14 100%);
      transition: background 0.8s ease;
    }

    .scene-bg.kitchen {
      background: linear-gradient(180deg, #2a2218 0%, #1a150f 60%, #0f0c08 100%);
    }

    .character {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      opacity: 0.35;
      transform: scale(0.9);
    }

    .character.active {
      opacity: 1;
      transform: scale(1.08);
      z-index: 10;
    }

    .character .avatar {
      font-size: 3.5rem;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    }

    .character.active .avatar {
      animation: bounce 0.4s ease;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .character .name {
      margin-top: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(0,0,0,0.55);
      padding: 3px 10px;
      border-radius: 20px;
    }

    .speech-bubble {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #111;
      padding: 8px 14px;
      border-radius: 14px;
      font-size: 0.85rem;
      max-width: 220px;
      text-align: center;
      margin-bottom: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }

    .speech-bubble::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 8px solid transparent;
      border-top-color: white;
    }

    .speech-bubble.visible {
      opacity: 1;
    }

    .timeline {
      display: flex;
      align-items: center;
      gap: 16px;
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

    .subtitle {
      text-align: center;
      font-size: 1.05rem;
      min-height: 1.6em;
      padding: 8px 16px;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--surface-2);
    }
  `]
})
export class PlayerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);

  @ViewChild('audioEl') audioRef!: ElementRef<HTMLAudioElement>;

  story = signal<GenerateResponse | null>(null);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  progress = signal(0);
  activeSpeaker = signal<string | null>(null);
  currentText = signal('');
  sceneKitchen = signal(false);

  // Hardcoded demo timeline (matches the pre-generated audio)
  private demoTimeline: TimelineEntry[] = [
    { t: 0.0,  speaker: 'narratore',   text: 'Piergiorgio aveva deciso che quella sera sarebbe stata la volta buona. Aveva bisogno di soldi, e sapeva dove trovarli.' },
    { t: 8.5,  speaker: 'piergiorgio', text: 'Dai nonna, è solo per un po\'... te li restituisco, giuro!' },
    { t: 13.2, speaker: 'narratore',   text: 'La nonna lo guardò con gli occhi stretti, la mano ancora chiusa sulla borsa della pensione.' },
    { t: 19.0, speaker: 'nonna',       text: 'Piergiorgio... tu pensi che io sia scema? Quella pensione è tutto quello che ho.' },
    { t: 26.5, speaker: 'piergiorgio', text: 'Ma nonna, è una cosa seria, ti prego...' },
    { t: 30.8, speaker: 'nonna',       text: 'Vai via. E non tornare finché non hai imparato il rispetto.' },
    { t: 36.5, speaker: 'narratore',   text: 'Piergiorgio abbassò lo sguardo. Per la prima volta, aveva perso.' }
  ];

  displaySpeakers = signal([
    { id: 'narratore',   name: 'Narratore',   emoji: '🎙️', left: '8%',  right: 'auto', bottom: '18%' },
    { id: 'piergiorgio', name: 'Piergiorgio', emoji: '👨',  left: '38%', right: 'auto', bottom: '12%' },
    { id: 'nonna',       name: 'Nonna',       emoji: '👵',  left: 'auto', right: '12%', bottom: '14%' }
  ]);

  audioSrc = signal('');
  private currentCueIndex = -1;

  ngOnInit() {
    const isDemo = this.route.snapshot.queryParamMap.get('demo') === 'true';

    if (isDemo) {
      // Use local demo audio (served from public/ or fallback)
      this.audioSrc.set('/piergiorgio_nonna.mp3');
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
    this.audioSrc.set(this.storyService.audioUrl(data.audioUrl));

    // Update display speakers from response if available
    if (data.speakers?.length) {
      // keep visual positions, just update names
    }
  }

  ngOnDestroy() {
    this.pause();
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

    const timeline = this.story()?.timeline || this.demoTimeline;
    const t = audio.currentTime;

    let active: TimelineEntry | null = null;
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (t >= timeline[i].t) {
        active = timeline[i];
        if (i !== this.currentCueIndex) {
          this.currentCueIndex = i;
          this.activeSpeaker.set(active.speaker);
          this.currentText.set(active.text);
          this.sceneKitchen.set(
            active.speaker === 'nonna' || active.speaker === 'piergiorgio'
          );
        }
        break;
      }
    }
  }

  onLoaded() {
    this.duration.set(this.audioRef.nativeElement.duration || 0);
  }

  onEnded() {
    this.isPlaying.set(false);
    this.currentCueIndex = -1;
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

  bubbleText(): string {
    const t = this.currentText();
    return t.length > 80 ? t.slice(0, 77) + '…' : t;
  }
}
