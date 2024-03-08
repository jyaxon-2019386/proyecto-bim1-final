import express from 'express'
import { filterByCategory, viewCatalogue, viewCategories, viewProductsByName } from './manageProduct.controller.js'

const api = express.Router()

api.post('/viewProductsByName', viewProductsByName)
api.get('/viewCatalogue', viewCatalogue)
api.get('/viewCategories', viewCategories)
api.post('/filterByCategory', filterByCategory)

export default api 