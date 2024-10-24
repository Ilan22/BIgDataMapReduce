import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl1 = 'http://localhost:3000/first';  // L'URL de ton API backend
  private apiUrl2 = 'http://localhost:3000/second';  // L'URL de ton API backend

  constructor(private http: HttpClient) {}

  uploadFileFirst(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(this.apiUrl1, formData);
  }

  uploadFileSecond(file: File, nbParGroupe: number): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    formData.append('nbParGroupe', nbParGroupe.toString());
    return this.http.post(this.apiUrl2, formData);
  }
}


