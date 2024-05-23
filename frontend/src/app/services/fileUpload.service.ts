import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxImageCompressService } from 'ngx-image-compress';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs'; // Import lastValueFrom

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private apiUrl = `${environment.backendUrl}/api`; 

  constructor(
    private http: HttpClient,
    private imageCompress: NgxImageCompressService
  ) {}

  /**
   * Uploads a file to MongoDB GridFS via the backend API.
   *
   * @param file - The base64 encoded file data.
   * @returns A Promise that resolves with the filename of the uploaded file.
   */
  async upload(file: string): Promise<string> {
    const compressedFile = await this.compressFile();
    const response$ = this.http.post(`${this.apiUrl}/upload`, { file: compressedFile }, { responseType: 'text' });
    return await lastValueFrom(response$); 
  }

  /**
   * Downloads a file from MongoDB GridFS by filename via the backend API.
   *
   * @param filename - The name of the file to download.
   * @returns A Promise that resolves with the file's content as a base64 data URL.
   */
  async download(filename: string): Promise<string> {
    const response$ = this.http.get(`${this.apiUrl}/download/${filename}`, { responseType: 'text' });
    return await lastValueFrom(response$); 
  }

  /**
   * Deletes a file from MongoDB GridFS by filename via the backend API.
   *
   * @param filename - The name of the file to delete.
   */
  async delete(filename: string): Promise<void> {
    const response$ = this.http.delete(`${this.apiUrl}/delete/${filename}`);
    return await lastValueFrom(response$);
  }

  /**
   * Compresses image using ngx-image-compress and returns the compressed image as base64 string
   *
   * @returns Promise<string> compressedImage - This is the base64 string of the compressed image
   */
  async compressFile() {
    const MAX_BYTE = 2 * Math.pow(10, 6);
    return this.imageCompress
      .uploadFile()
      .then(({ image, orientation }) => {
        const compressAmount = Math.min(
          (MAX_BYTE / this.imageCompress.byteCount(image)) * 100,
          100
        );
        return this.imageCompress.compressFile(
          image,
          orientation,
          compressAmount,
          compressAmount
        );
      })
      .then((compressedImage) => {
        return compressedImage;
      });
  }
}
