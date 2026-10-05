import { Component, OnInit, inject, signal } from '@angular/core';
import { Tarea } from './tarea.model';
import { TareasService } from './tareas.service';

@Component({
  selector: 'app-tareas',
  standalone: true,
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css',
})
export class TareasComponent implements OnInit {
  private readonly tareasService = inject(TareasService);
  tareas = signal<Tarea[]>([]);
  editandoId = signal<number | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.tareasService.listar().subscribe((tareas) => {
      this.tareas.set(tareas);
    });
  }

  crear(titulo: string) {
    this.tareasService.crear(titulo).subscribe((tarea) => {
      this.tareas.update((tareas) => [...tareas, tarea]);
    });
  }

  empezarEdicion(id: number) {
    this.error.set(null);
    this.editandoId.set(id);
  }

  guardar(id: number, titulo: string) {
    this.tareasService.actualizar(id, titulo).subscribe({
      next: (actualizada) => {
        this.tareas.update((tareas) =>
          tareas.map((t) => (t.id === actualizada.id ? actualizada : t)),
        );
        this.editandoId.set(null);
        this.error.set(null);
      },
      error: (e) => this.manejarError(e),
    });
  }

  eliminar(id: number) {
    this.tareasService.eliminar(id).subscribe({
      next: (eliminada) => {
        this.tareas.update((tareas) =>
          tareas.filter((t) => t.id !== eliminada.id),
        );
        this.error.set(null);
      },
      error: (e) => this.manejarError(e),
    });
  }

  private manejarError(e: { status?: number }) {
    this.editandoId.set(null);
    if (e?.status === 404) {
      this.error.set('La tarea ya no existe. Se actualizó la lista.');
      this.cargar();
    } else {
      this.error.set('No se pudo completar la operación.');
    }
  }
}