import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GenerateRequest,
  GenerateResponse,
  Voice
} from '../models/story.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

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
