import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AtmFormComponent } from '../atm-form/atm-form.component';
import { NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface Atm {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  serialNumber: string;
  isDeleted: boolean;
  deletedAt: number;
  createdAt: string;
  image: string;
}

@Component({
  selector: 'app-atm-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    HttpClientModule,
    MatMenuModule,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './atm-list.component.html',
  styleUrls: ['./atm-list.component.scss'],
})
export class AtmListComponent implements AfterViewInit {
  displayedColumns: Array<keyof Atm | 'action' | 'index'> = [
    'index',
    'name',
    'manufacturer',
    'type',
    'serialNumber',
    'image',
    'action',
  ];
  dataSource = new MatTableDataSource<Atm>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.fetchAtmData();
  }

  fetchAtmData(
    page: number = 1,
    limit: number = this.paginator?.pageSize || 10
  ) {
    this.http
      .get<Atm[]>('https://67c7e03ac19eb8753e7b1c04.mockapi.io/api/v1/atm', {
        params: {
          isDeleted: false,
        } as Record<keyof Atm, any>,
        responseType: 'json',
      })
      .subscribe(
        (data: Atm[]) => {
          const cleanedData = data?.filter(
            ({ name, manufacturer, type, serialNumber }) =>
              [name, manufacturer, type, serialNumber]
                ?.map((el) => el?.toLowerCase())
                .some((el) => el?.includes(this?.dataSource?.filter))
          );
          const dataDesc = cleanedData?.reverse();
          this.dataSource.data = dataDesc?.map((el, i) => ({
            ...el,
            index: (i + 1 + limit * (page - 1)).toString(),
          }));
          if (this.paginator) {
            this.paginator.firstPage();
          }
        },
        (error) => {
          this.dataSource.data = [];
          console.error('Failed to fetch ATM data:', error?.message);
        }
      );
  }

  exportExcel() {
    const data = this.dataSource.data;

    if (!data || data.length === 0) {
      console.warn('No data to export!');
      return;
    }

    // Clean data (optional)
    const cleanedData = data.map(({ isDeleted, deletedAt, id, ...atm }) => atm);

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(cleanedData);

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ATM List');

    // Save the workbook as an Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'atm-list.xlsx');
  }

  applyFilter(searchValue: string) {
    const filterValue = searchValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.fetchAtmData();
  }

  convertToXml(data: any[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<atms>\n';

    data.forEach((item) => {
      xml += '  <atm>\n';
      Object.keys(item).forEach((key) => {
        xml += `    <${key}>${item[key]}</${key}>\n`;
      });
      xml += '  </atm>\n';
    });

    xml += '</atms>';
    return xml;
  }

  onAddNew() {
    const dialogRef = this.dialog.open(AtmFormComponent, {
      width: '600px',
    });
    dialogRef.afterClosed().subscribe((result: Atm) => {
      if (result) {
        this.fetchAtmData();
      }
    });
  }

  onEdit(element: Atm) {
    const dialogRef = this.dialog.open(AtmFormComponent, {
      width: '600px',
      data: { atm: element },
    });

    dialogRef.afterClosed().subscribe((updatedAtm: Atm) => {
      if (updatedAtm) {
        this.fetchAtmData();
      }
    });
  }

  onView(element: Atm) {
    alert('This feature is coming soon');
  }

  onDelete(element: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete ATM',
        message: `Are you sure you want to delete ATM "${element.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedData = {
          ...element,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        };

        this.http
          .put(
            `https://67c7e03ac19eb8753e7b1c04.mockapi.io/api/v1/atm/${element.id}`,
            updatedData
          )
          .subscribe({
            next: () => {
              this.fetchAtmData();
            },
            error: (error) => {
              console.error('Failed to delete ATM:', error?.message);
            },
          });
      }
    });
  }
}
