import express from 'express'
import { editInvoice, exportInvoiceToPDF, getPurchaseHistory, getUserInvoices, removeProductFromCart, saveCart  } from './invoice.controller.js'
import { isAdmin, validateJwt } from '../../middlewares/validate-jwt.js'

const api = express.Router()

api.put('/editInvoice', [validateJwt], editInvoice)
api.get('/getUserInvoices/:id', getUserInvoices)
api.post('/saveCart',  saveCart)
api.get('/getPurchaseHistory', [validateJwt], getPurchaseHistory)
api.get('/exportInvoiceToPDF', [validateJwt], exportInvoiceToPDF)
api.post('/removeProductFromCart', [validateJwt],removeProductFromCart)

export default api