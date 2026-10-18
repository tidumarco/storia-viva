import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GenerateRequest,
  GenerateResponse,
  Voice
} from '../models/story.model';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private http = inject(HttpClient);

  // Change this if your backend runs on a different port/host
  private readonly baseUrl = 'http://localhost:3001';

  generate(request: GenerateRequest): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(`${this.baseUrl}/api/generate`, {
      ...request,
      language: request.language || 'it'
    });
  }

  getVoices(): Observable<{ voices: Voice[]; defaultLanguage: string }> {
    return this.http.get<{ voices: Voice[]; defaultLanguage: string }>(
      `${this.baseUrl}/api/voices`
    );
  }

  /** Full URL for an audio path returned by the backend */
  audioUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}${path}`;
  }
}
