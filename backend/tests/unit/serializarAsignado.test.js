const serializarAsignado = require('../../utils/serializarAsignado');

describe('Utilidad: serializarAsignado', () => {
    it('debe retornar null si el usuario asignado es null o undefined', () => {
        expect(serializarAsignado(null)).toBeNull();
        expect(serializarAsignado(undefined)).toBeNull();
    });

    it('debe retornar null si el documento no está poblado (solo es un ObjectId sin nombre)', () => {
        const idSinPoblar = { _id: '65f1a2b3c4d5e6f7a8b9c0d1' };
        expect(serializarAsignado(idSinPoblar)).toBeNull();
    });

    it('debe retornar { id, _id, nombre, email } cuando el usuario está poblado', () => {
        const asignadoDoc = {
            _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c0d1' },
            nombre: 'Profesor Guía',
            email: 'guia@utalca.cl'
        };

        const resultado = serializarAsignado(asignadoDoc);

        expect(resultado).toEqual({
            id: '65f1a2b3c4d5e6f7a8b9c0d1',
            _id: '65f1a2b3c4d5e6f7a8b9c0d1',
            nombre: 'Profesor Guía',
            email: 'guia@utalca.cl'
        });
    });
});
