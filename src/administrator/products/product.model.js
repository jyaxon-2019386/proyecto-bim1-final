import { Schema, model } from 'mongoose';

const productSchema = Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'category',
    required: true
  },
  stock:{
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return Number.isInteger(Number(value));
      },
      message: 'Stock must be an integer'
    }
  }
}, {
  versionKey: false // Deshabilitar el __v (versión del documento)
});

export default model('product', productSchema);