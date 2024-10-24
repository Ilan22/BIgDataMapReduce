import { Component } from '@angular/core';
import { UploadService } from './UploadService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'front';

  selectedFile: File | null = null;
  data?: string;
  loading: boolean = false;
  error: boolean = false;
  firstExo = true;
  nbParGroupe = 3;
  missingFile = false;

  constructor(private uploadService: UploadService) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.missingFile = false;
      this.loading = true;
      this.error = false;
      const uploadObservable = this.firstExo
        ? this.uploadService.uploadFileFirst(this.selectedFile)
        : this.uploadService.uploadFileSecond(
            this.selectedFile,
            this.nbParGroupe
          );

      uploadObservable.subscribe(
        (response) => {
          this.data = response.data;
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          this.error = true;
          console.error('File upload error:', error);
        }
      );
    } else {
      this.missingFile = true;
    }
  }

  change(number: number): void {
    this.firstExo = number === 1 ? true : false;
  }
}
