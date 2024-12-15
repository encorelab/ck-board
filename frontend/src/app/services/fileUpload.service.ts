import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Changes: Using map to extract the image URL and settings from the response
    return this.http.post('upload', formData).pipe(
      map((response: any) => {
        return {
          imageUrl: response.fileId, // Ensure backend sends this key
        };
      })
    );
  }

  deleteImage(fileId: string): Observable<any> {
    return this.http.delete(`upload/${fileId}`);
  }

  getImage(filename: string) {
    return this.http.get(`/api/upload/${filename}`, { responseType: 'blob' });
  }
}
