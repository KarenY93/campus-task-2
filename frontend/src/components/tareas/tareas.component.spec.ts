import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Tarea } from './tarea.model';
import { TareasComponent } from './tareas.component';
import { TareasService } from './tareas.service';

describe('TareasComponent', () => {
  let fixture: ComponentFixture<TareasComponent>;
  let tareasService: jasmine.SpyObj<TareasService>;

  const iniciales: Tarea[] = [
    { id: 1, titulo: 'Leer la guía de la clase 2' },
  ];

  beforeEach(async () => {
    tareasService = jasmine.createSpyObj('TareasService', [
      'listar',
      'crear',
      'actualizar',
      'eliminar',
    ]);
    tareasService.listar.and.returnValue(of(iniciales));

    await TestBed.configureTestingModule({
      imports: [TareasComponent],
      providers: [{ provide: TareasService, useValue: tareasService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TareasComponent);
    fixture.detectChanges();
  });

  it('muestra el id y el título de cada tarea', () => {
    const elemento: HTMLElement = fixture.nativeElement;

    expect(elemento.querySelector('.numero')?.textContent).toContain('1');
    expect(elemento.querySelector('.titulo')?.textContent).toContain(
      'Leer la guía de la clase 2',
    );
    expect(tareasService.listar).toHaveBeenCalled();
  });

  it('agrega la tarea creada al hacer clic en Agregar', () => {
    tareasService.crear.and.returnValue(
      of({ id: 2, titulo: 'Preparar el entorno' }),
    );

    const elemento: HTMLElement = fixture.nativeElement;
    const input = elemento.querySelector('input');
    expect(input).not.toBeNull();
    input!.value = 'Preparar el entorno';
    elemento.querySelector('button')!.click();
    fixture.detectChanges();

    expect(tareasService.crear).toHaveBeenCalledWith('Preparar el entorno');
    const titulos = Array.from(elemento.querySelectorAll('.titulo')).map(
      (nodo) => nodo.textContent,
    );
    expect(titulos).toEqual([
      'Leer la guía de la clase 2',
      'Preparar el entorno',
    ]);
  });

  // Ayudantes para las pruebas nuevas
  function montarConLista(lista: Tarea[]): HTMLElement {
    tareasService.listar.and.returnValue(of(lista));
    fixture = TestBed.createComponent(TareasComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function botonEn(contenedor: Element, texto: string): HTMLButtonElement {
    const boton = Array.from(contenedor.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === texto,
    );
    expect(boton).withContext(`botón ${texto}`).toBeDefined();
    return boton as HTMLButtonElement;
  }

  it('edita una tarea al pulsar Editar, escribir y pulsar Guardar', () => {
    // Preparar
    const elemento = montarConLista([
      { id: 1, titulo: 'Leer la guía de la clase 2' },
      { id: 2, titulo: 'Preparar el entorno' },
    ]);
    tareasService.actualizar.and.returnValue(
      of({ id: 1, titulo: 'Título nuevo' }),
    );

    // Ejecutar
    const primera = elemento.querySelectorAll('li')[0];
    botonEn(primera, 'Editar').click();
    fixture.detectChanges();

    const campo = elemento.querySelector('.editar-input') as HTMLInputElement;
    expect(campo).not.toBeNull();
    campo.value = 'Título nuevo';
    botonEn(elemento.querySelectorAll('li')[0], 'Guardar').click();
    fixture.detectChanges();

    // Verificar
    expect(tareasService.actualizar).toHaveBeenCalledWith(1, 'Título nuevo');
    const titulos = Array.from(elemento.querySelectorAll('.titulo')).map(
      (nodo) => nodo.textContent,
    );
    expect(titulos).toEqual(['Título nuevo', 'Preparar el entorno']);
  });

  it('elimina una tarea al pulsar Eliminar y deja las demás', () => {
    // Preparar
    const elemento = montarConLista([
      { id: 1, titulo: 'Leer la guía de la clase 2' },
      { id: 2, titulo: 'Preparar el entorno' },
    ]);
    tareasService.eliminar.and.returnValue(
      of({ id: 1, titulo: 'Leer la guía de la clase 2' }),
    );

    // Ejecutar
    botonEn(elemento.querySelectorAll('li')[0], 'Eliminar').click();
    fixture.detectChanges();

    // Verificar
    expect(tareasService.eliminar).toHaveBeenCalledWith(1);
    const titulos = Array.from(elemento.querySelectorAll('.titulo')).map(
      (nodo) => nodo.textContent,
    );
    expect(titulos).toEqual(['Preparar el entorno']);
  });
});