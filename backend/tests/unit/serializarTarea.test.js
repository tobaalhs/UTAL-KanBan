const serializarTarea = require('../../utils/serializarTarea');

describe('Utilidad: serializarTarea', () => {
  it('debe serializar una tarea básica con etiquetas y subtareas vacías por defecto', () => {
    const tareaDoc = {
      _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c001' },
      tableroId: { toString: () => '65f1a2b3c4d5e6f7a8b9c002' },
      titulo: 'Implementar filtros',
      descripcion: 'Filtros por tarea, prioridad y etiqueta',
      estado: 'Pendiente',
      prioridad: 'Alta',
      asignadoId: null,
      createdAt: new Date('2026-11-20T10:00:00.000Z'),
      updatedAt: new Date('2026-11-20T12:00:00.000Z')
    };

    const resultado = serializarTarea(tareaDoc);

    expect(resultado).toEqual({
      id: '65f1a2b3c4d5e6f7a8b9c001',
      _id: '65f1a2b3c4d5e6f7a8b9c001',
      tableroId: '65f1a2b3c4d5e6f7a8b9c002',
      tablero: '65f1a2b3c4d5e6f7a8b9c002',
      titulo: 'Implementar filtros',
      descripcion: 'Filtros por tarea, prioridad y etiqueta',
      estado: 'Pendiente',
      prioridad: 'Alta',
      asignado: null,
      etiquetas: [],
      subtareas: [],
      createdAt: tareaDoc.createdAt,
      updatedAt: tareaDoc.updatedAt
    });
  });

  it('debe serializar etiquetas, usuario asignado y subtareas con sus respectivos responsables', () => {
    const tareaDoc = {
      _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c001' },
      tableroId: { toString: () => '65f1a2b3c4d5e6f7a8b9c002' },
      titulo: 'Release v2',
      descripcion: 'Preparar entrega',
      estado: 'En curso',
      prioridad: 'Media',
      asignadoId: {
        _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c010' },
        nombre: 'Ana Desarrolladora',
        email: 'ana@utalca.cl'
      },
      etiquetas: ['Backend', 'QA'],
      subtareas: [
        {
          _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c020' },
          titulo: 'Escribir pruebas unitarias',
          completada: true,
          asignadoId: {
            _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c011' },
            nombre: 'Carlos Tester',
            email: 'carlos@utalca.cl'
          }
        },
        {
          _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c021' },
          titulo: 'Documentar endpoints',
          completada: 0,
          asignadoId: null
        }
      ],
      createdAt: new Date('2026-11-21T10:00:00.000Z'),
      updatedAt: new Date('2026-11-21T11:00:00.000Z')
    };

    const resultado = serializarTarea(tareaDoc);

    expect(resultado.etiquetas).toEqual(['Backend', 'QA']);
    expect(resultado.asignado).toEqual({
      id: '65f1a2b3c4d5e6f7a8b9c010',
      _id: '65f1a2b3c4d5e6f7a8b9c010',
      nombre: 'Ana Desarrolladora',
      email: 'ana@utalca.cl'
    });
    expect(resultado.subtareas).toEqual([
      {
        _id: '65f1a2b3c4d5e6f7a8b9c020',
        titulo: 'Escribir pruebas unitarias',
        completada: true,
        asignado: {
          id: '65f1a2b3c4d5e6f7a8b9c011',
          _id: '65f1a2b3c4d5e6f7a8b9c011',
          nombre: 'Carlos Tester',
          email: 'carlos@utalca.cl'
        }
      },
      {
        _id: '65f1a2b3c4d5e6f7a8b9c021',
        titulo: 'Documentar endpoints',
        completada: false,
        asignado: null
      }
    ]);
  });
});
