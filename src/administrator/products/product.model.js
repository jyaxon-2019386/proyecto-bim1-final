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
    required: true
  }
}, {
  versionKey: false //Desahabilitar el __v (version del documento)
}
)

export default model('product', productSchema)

