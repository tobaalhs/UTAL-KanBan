const mongoose = require('mongoose');
const Tablero = require('../../models/tablero.models');
const Tarea = require('../../models/tarea.models');
const {
  crearTarea,
  actualizarTarea,
  actualizarEstadoTarea,
  listarEtiquetasGlobales
} = require('../../services/tarea.service');

jest.mock('../../models/tablero.models');
jest.mock('../../models/tarea.models');

describe('Servicio: tarea.service', () => {
  const usuarioAId = new mongoose.Types.ObjectId();
  const usuarioBId = new mongoose.Types.ObjectId();
  const usuarioExternoId = new mongoose.Types.ObjectId();
  const tableroId = new mongoose.Types.ObjectId();
  const tareaId = new mongoose.Types.ObjectId();

  const crearTableroMock = () => ({
    _id: tableroId,
    creadorId: usuarioAId,
    miembros: [usuarioAId, usuarioBId]
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crearTarea (etiquetas y subtareas)', () => {
    it('debe normalizar etiquetas (trim y sin duplicados case-insensitive) y subtareas con asignado', async () => {
      Tablero.findById.mockResolvedValue(crearTableroMock());

      const mockPopulate = jest.fn().mockResolvedValue(undefined);
      Tarea.create.mockImplementation(async (datos) => ({
        _id: tareaId,
        ...datos,
        asignadoId: {
          _id: usuarioAId,
          nombre: 'Usuario A',
          email: 'a@utalca.cl'
        },
        subtareas: datos.subtareas.map((s) => ({
          _id: new mongoose.Types.ObjectId(),
          ...s,
          asignadoId: s.asignadoId
            ? { _id: usuarioBId, nombre: 'Usuario B', email: 'b@utalca.cl' }
            : null
        })),
        populate: mockPopulate
      }));

      const resultado = await crearTarea(
        tableroId.toString(),
        {
          titulo: 'Tarea con etiquetas y subtareas',
          descripcion: 'Detalle',
          prioridad: 'Alta',
          asignadoId: usuarioAId.toString(),
          etiquetas: ['  Backend ', 'backend', 'URGENTE', '', '   ', 'QA'],
          subtareas: [
            {
              titulo: '  Subtarea asignada  ',
              completada: false,
              asignadoId: usuarioBId.toString()
            },
            {
              titulo: 'Subtarea sin asignar',
              completada: true
            },
            {
              titulo: '   ' // Debe descartarse por estar vacía
            }
          ]
        },
        usuarioAId.toString()
      );

      expect(Tarea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tableroId,
          titulo: 'Tarea con etiquetas y subtareas',
          estado: 'Pendiente',
          etiquetas: ['Backend', 'URGENTE', 'QA'],
          subtareas: [
            {
              titulo: 'Subtarea asignada',
              completada: false,
              asignadoId: usuarioBId.toString()
            },
            {
              titulo: 'Subtarea sin asignar',
              completada: true,
              asignadoId: null
            }
          ]
        })
      );
      expect(mockPopulate).toHaveBeenCalledTimes(1);
      expect(resultado.etiquetas).toEqual(['Backend', 'URGENTE', 'QA']);
      expect(resultado.subtareas).toHaveLength(2);
      expect(resultado.subtareas[0].asignado.id).toBe(usuarioBId.toString());
      expect(resultado.subtareas[1].completada).toBe(true);
      expect(resultado.subtareas[1].asignado).toBeNull();
    });

    it('debe lanzar error 400 si el usuario asignado a una subtarea no es miembro del tablero', async () => {
      Tablero.findById.mockResolvedValue(crearTableroMock());

      await expect(
        crearTarea(
          tableroId.toString(),
          {
            titulo: 'Tarea inválida',
            subtareas: [
              {
                titulo: 'Subtarea con intruso',
                asignadoId: usuarioExternoId.toString()
              }
            ]
          },
          usuarioAId.toString()
        )
      ).rejects.toMatchObject({
        status: 400,
        message: 'El usuario asignado no es miembro del tablero'
      });

      expect(Tarea.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizarTarea (bloqueo al finalizar y edición de etiquetas/subtareas)', () => {
    it('debe lanzar error 409 si la tarea ya está en estado "Terminado"', async () => {
      const mockSave = jest.fn();
      Tarea.findById.mockResolvedValue({
        _id: tareaId,
        tableroId,
        titulo: 'Tarea Finalizada',
        estado: 'Terminado',
        save: mockSave
      });
      Tablero.findById.mockResolvedValue(crearTableroMock());

      await expect(
        actualizarTarea(
          tareaId.toString(),
          {
            titulo: 'Intento de modificación',
            prioridad: 'Alta',
            etiquetas: ['Nuevo']
          },
          usuarioAId.toString()
        )
      ).rejects.toMatchObject({
        status: 409,
        message: 'Una tarea finalizada no se puede modificar'
      });

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('debe permitir actualizar etiquetas, prioridad y subtareas cuando la tarea NO está terminada', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockPopulate = jest.fn().mockResolvedValue(undefined);
      const tareaEnCurso = {
        _id: tareaId,
        tableroId,
        titulo: 'Tarea original',
        descripcion: 'Desc',
        estado: 'En curso',
        prioridad: 'Media',
        asignadoId: null,
        etiquetas: ['Vieja'],
        subtareas: [],
        save: mockSave,
        populate: mockPopulate
      };

      Tarea.findById.mockResolvedValue(tareaEnCurso);
      Tablero.findById.mockResolvedValue(crearTableroMock());

      const resultado = await actualizarTarea(
        tareaId.toString(),
        {
          titulo: 'Tarea actualizada',
          prioridad: 'Alta',
          etiquetas: ['Frontend', 'frontend', 'UI'],
          subtareas: [
            {
              titulo: 'Diseñar filtro',
              completada: true,
              asignadoId: usuarioAId.toString()
            }
          ]
        },
        usuarioAId.toString()
      );

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(tareaEnCurso.titulo).toBe('Tarea actualizada');
      expect(tareaEnCurso.prioridad).toBe('Alta');
      expect(tareaEnCurso.etiquetas).toEqual(['Frontend', 'UI']);
      expect(tareaEnCurso.subtareas).toEqual([
        {
          titulo: 'Diseñar filtro',
          completada: true,
          asignadoId: usuarioAId.toString()
        }
      ]);
      expect(resultado.etiquetas).toEqual(['Frontend', 'UI']);
    });

    it('debe permitir cambiar el estado de una tarea terminada mediante actualizarEstadoTarea', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const tareaTerminada = {
        _id: tareaId,
        tableroId,
        estado: 'Terminado',
        save: mockSave
      };

      Tarea.findById.mockResolvedValue(tareaTerminada);
      Tablero.findById.mockResolvedValue(crearTableroMock());

      const res = await actualizarEstadoTarea(
        tareaId.toString(),
        'En curso',
        usuarioAId.toString()
      );

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(res.estado).toBe('En curso');
    });
  });

  describe('listarEtiquetasGlobales (soporte para filtro de etiquetas)', () => {
    it('debe retornar las etiquetas únicas filtradas y ordenadas alfabéticamente', async () => {
      Tarea.distinct.mockResolvedValue(['Urgente', '', '   ', 'Backend', 'api', null]);

      const etiquetas = await listarEtiquetasGlobales();

      expect(Tarea.distinct).toHaveBeenCalledWith('etiquetas');
      expect(etiquetas).toEqual(['api', 'Backend', 'Urgente']);
    });
  });
});
