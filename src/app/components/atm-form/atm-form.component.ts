import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-atm-form',
  templateUrl: './atm-form.component.html',
  styleUrls: ['./atm-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtmFormComponent implements OnInit {
  atmForm!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<AtmFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data?.atm;
    this.initForm();
  }

  initForm() {
    this.atmForm = this.fb.group({
      name: [this.data?.atm?.name || '', Validators.required],
      manufacturer: [this.data?.atm?.manufacturer || '', Validators.required],
      type: [this.data?.atm?.type || '', Validators.required],
      serialNumber: [this.data?.atm?.serialNumber || '', Validators.required],
      image: [
        this.data?.atm?.image || '',
        Validators.pattern(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i),
      ],
    });
  }

  save() {
    if (this.atmForm.invalid) return;
    const formData = this.atmForm.value;
    const apiUrl = 'https://67c7e03ac19eb8753e7b1c04.mockapi.io/api/v1/atm';

    const request =
      this.isEditMode && this.data?.atm?.id
        ? this.http.put(`${apiUrl}/${this.data.atm.id}`, formData)
        : this.http.post(apiUrl, formData);

    request.subscribe({
      next: (response) => this.dialogRef.close(response),
      error: (error) => console.error('Error saving ATM:', error),
    });
  }

  close() {
    this.dialogRef.close();
  }
}
