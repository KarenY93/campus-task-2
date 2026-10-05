import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DatabaseService } from '../database/database.service';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

describe('Tareas HTTP', () => {
  let app: INestApplication;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();

    const module = await Test.createTestingModule({
      controllers: [TareasController],
      providers: [
        TareasService,
        { provide: DatabaseService, useValue: { query } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /tareas responde las filas que devuelve la base', async () => {
    query.mockResolvedValue({
      rows: [{ id: 1, titulo: 'Leer la guía de la clase 2' }],
    });

    await request(app.getHttpServer())
      .get('/tareas')
      .expect(200)
      .expect([{ id: 1, titulo: 'Leer la guía de la clase 2' }]);
  });

  it('POST /tareas guarda el título recibido en el cuerpo', async () => {
    query.mockResolvedValue({
      rows: [{ id: 3, titulo: 'Preparar el entorno' }],
    });

    await request(app.getHttpServer())
      .post('/tareas')
      .send({ titulo: 'Preparar el entorno' })
      .expect(201)
      .expect({ id: 3, titulo: 'Preparar el entorno' });

    expect(query).toHaveBeenCalledWith(
      'INSERT INTO tareas (titulo) VALUES ($1) RETURNING id, titulo',
      ['Preparar el entorno'],
    );
  });

  it('PATCH /tareas/:id actualiza el título y responde 200', async () => {
    query.mockResolvedValue({
      rows: [{ id: 1, titulo: 'Título nuevo' }],
    });

    await request(app.getHttpServer())
      .patch('/tareas/1')
      .send({ titulo: 'Título nuevo' })
      .expect(200)
      .expect({ id: 1, titulo: 'Título nuevo' });

    expect(query).toHaveBeenCalledWith(
      'UPDATE tareas SET titulo = $1 WHERE id = $2 RETURNING id, titulo',
      ['Título nuevo', 1],
    );
  });

  it('PATCH /tareas/:id responde 404 si la tarea no existe', async () => {
    query.mockResolvedValue({ rows: [] });

    await request(app.getHttpServer())
      .patch('/tareas/999')
      .send({ titulo: 'Título nuevo' })
      .expect(404);
  });

    // 1. Obligatoria: DELETE existente
  it('DELETE /tareas/:id elimina la tarea y responde 200', async () => {
    query.mockResolvedValue({
      rows: [{ id: 1, titulo: 'Leer la guía de la clase 2' }],
    });

    await request(app.getHttpServer())
      .delete('/tareas/1')
      .expect(200)
      .expect({ id: 1, titulo: 'Leer la guía de la clase 2' });

    expect(query).toHaveBeenCalledWith(
      'DELETE FROM tareas WHERE id = $1 RETURNING id, titulo',
      [1],
    );
  });

  // 2. Obligatoria: DELETE inexistente
  it('DELETE /tareas/:id responde 404 si la tarea no existe', async () => {
    query.mockResolvedValue({ rows: [] });

    await request(app.getHttpServer()).delete('/tareas/999').expect(404);

    expect(query).toHaveBeenCalledWith(
      'DELETE FROM tareas WHERE id = $1 RETURNING id, titulo',
      [999],
    );
  });

  // 3. El id de la URL llega al servicio como number
  it('DELETE /tareas/:id convierte el id de la URL a number', async () => {
    query.mockResolvedValue({ rows: [{ id: 7, titulo: 'X' }] });

    await request(app.getHttpServer()).delete('/tareas/7').expect(200);

    const [, params] = query.mock.calls[0];
    expect(params).toEqual([7]);
    expect(typeof params[0]).toBe('number');
  });

  // 4. Una sola consulta por petición
  it('DELETE /tareas/:id ejecuta una sola consulta', async () => {
    query.mockResolvedValue({ rows: [{ id: 2, titulo: 'Y' }] });

    await request(app.getHttpServer()).delete('/tareas/2').expect(200);

    expect(query).toHaveBeenCalledTimes(1);
  });

  // 5. El cuerpo de la respuesta es la tarea eliminada, no un texto vacío
  it('DELETE /tareas/:id devuelve la tarea eliminada en el cuerpo', async () => {
    const eliminada = { id: 42, titulo: 'Otra tarea' };
    query.mockResolvedValue({ rows: [eliminada] });

    const respuesta = await request(app.getHttpServer())
      .delete('/tareas/42')
      .expect(200);

    expect(respuesta.body).toEqual(eliminada);
  });

  // 6. Un fallo de la base se refleja como error del servidor
  it('DELETE /tareas/:id responde 500 si la base de datos falla', async () => {
    query.mockRejectedValue(new Error('fallo de conexión'));

    await request(app.getHttpServer()).delete('/tareas/1').expect(500);
  });
});
function expect(body: any) {
  throw new Error('Function not implemented.');
}

