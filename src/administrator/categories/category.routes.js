import express from "express"
import { save, test, get, update, deleteC, search } from './category.controller.js'


const api = express.Router()

api.get('/test', test)
api.post('/save', save)
api.get('/get', get)
api.put('/update/:id', update)
api.delete('/deleteC/:id', deleteC)
api.post('/search', search)


export default api