import { Test } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { TareasService } from './tareas.service';

describe('TareasService', () => {
  let service: TareasService;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        TareasService,
        { provide: DatabaseService, useValue: { query } },
      ],
    }).compile();

    service = module.get(TareasService);
  });

  it('devuelve las filas de la consulta al listar', async () => {
    const tareas = [{ id: 1, titulo: 'Leer la guía de la clase 2' }];
    query.mockResolvedValue({ rows: tareas });

    await expect(service.listar()).resolves.toEqual(tareas);
    expect(query).toHaveBeenCalledWith(
      'SELECT id, titulo FROM tareas ORDER BY id',
    );
  });

  it('inserta el título y devuelve la fila creada', async () => {
    const creada = { id: 2, titulo: 'Nueva tarea' };
    query.mockResolvedValue({ rows: [creada] });

    await expect(service.crear('Nueva tarea')).resolves.toEqual(creada);
    expect(query).toHaveBeenCalledWith(
      'INSERT INTO tareas (titulo) VALUES ($1) RETURNING id, titulo',
      ['Nueva tarea'],
    );
  });

    it('actualiza el título y devuelve la fila actualizada', async () => {
    const actualizada = { id: 1, titulo: 'Nuevo título' };
    query.mockResolvedValue({ rows: [actualizada] });

    await expect(service.actualizar(1, 'Nuevo título')).resolves.toEqual(
      actualizada,
    );
    expect(query).toHaveBeenCalledWith(
      'UPDATE tareas SET titulo = $1 WHERE id = $2 RETURNING id, titulo',
      ['Nuevo título', 1],
    );
  });

    // 1. Prueba obligatoria del taller
  it('elimina la tarea y devuelve la fila eliminada', async () => {
    const eliminada = { id: 1, titulo: 'Leer la guía de la clase 2' };
    query.mockResolvedValue({ rows: [eliminada] });

    await expect(service.eliminar(1)).resolves.toEqual(eliminada);
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM tareas WHERE id = $1 RETURNING id, titulo',
      [1],
    );
  });

  // 2. Consulta parametrizada: el id no se concatena en el SQL
  it('no concatena el id dentro del texto SQL', async () => {
    query.mockResolvedValue({ rows: [{ id: 5, titulo: 'X' }] });

    await service.eliminar(5);

    const [sql] = query.mock.calls[0];
    expect(sql).toContain('$1');
    expect(sql).not.toContain('5');
  });

  // 3. El id viaja como parámetro numérico
  it('envía el id como number en los parámetros', async () => {
    query.mockResolvedValue({ rows: [{ id: 7, titulo: 'Y' }] });

    await service.eliminar(7);

    const [, params] = query.mock.calls[0];
    expect(params).toEqual([7]);
    expect(typeof params[0]).toBe('number');
  });

  // 4. Id inexistente: no devuelve una tarea
  it('devuelve undefined cuando el id no existe', async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(service.eliminar(999)).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM tareas WHERE id = $1 RETURNING id, titulo',
      [999],
    );
  });

  // 5. Una sola consulta por llamada
  it('ejecuta una sola consulta al eliminar', async () => {
    query.mockResolvedValue({ rows: [{ id: 2, titulo: 'Z' }] });

    await service.eliminar(2);

    expect(query).toHaveBeenCalledTimes(1);
  });

  // 6. Los errores de la base de datos no se ocultan
  it('propaga el error si la base de datos falla', async () => {
    query.mockRejectedValue(new Error('fallo de conexión'));

    await expect(service.eliminar(1)).rejects.toThrow('fallo de conexión');
  });

  // 7. Usa el id recibido, no uno fijo
  it('elimina la tarea correspondiente al id recibido', async () => {
    const eliminada = { id: 42, titulo: 'Otra tarea' };
    query.mockResolvedValue({ rows: [eliminada] });

    await expect(service.eliminar(42)).resolves.toEqual(eliminada);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [
      42,
    ]);
  });
});
