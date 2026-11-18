const mongoose = require('mongoose');

const subtareaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    completada: {
        type: Boolean,
        default: false
    },
    asignadoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    }
});

const tareaSchema = new mongoose.Schema({
    tableroId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tablero',
        required: true,
        index: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'En curso', 'Terminado'],
        default: 'Pendiente'
    },
    prioridad: {
        type: String,
        enum: ['Alta', 'Media', 'Baja'],
        default: 'Media'
    },
    asignadoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    etiquetas: {
        type: [String],
        default: []
    },
    subtareas: {
        type: [subtareaSchema],
        default: []
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Tarea', tareaSchema);
