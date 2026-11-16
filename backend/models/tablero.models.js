const mongoose = require('mongoose');

const tableroSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    creadorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    miembros: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }]
}, {
    timestamps: true,
    versionKey: false
});

tableroSchema.pre('validate', function () {
    if (!this.creadorId) {
        return;
    }

    const miembrosUnicos = new Map();
    miembrosUnicos.set(this.creadorId.toString(), this.creadorId);

    for (const miembro of this.miembros || []) {
        const miembroId = miembro._id || miembro;
        miembrosUnicos.set(miembroId.toString(), miembroId);
    }

    this.miembros = Array.from(miembrosUnicos.values());
});

module.exports = mongoose.model('Tablero', tableroSchema);
