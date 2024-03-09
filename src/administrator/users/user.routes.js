import express from "express";
import { deleteUser, deleteYourProfile, editUserInfo, login, editUserInfoClient, register, updateUserRole } from "./user.controller.js";
import { authorizeDeleteUser, isAdmin, validateJwt, isClient } from "../../middlewares/validate-jwt.js";

const api = express.Router()

// api.post('/registerAdmin', registerAdmin)
// api.post('/registerClient', registerClient)
api.post('/register', register)
api.post('/login', login)
api.delete('/deleteYourProfile/:id', [validateJwt, authorizeDeleteUser], deleteYourProfile)
api.delete('/deleteUser/:id', [validateJwt, isAdmin], deleteUser)
api.put('/updateUserRole/:id', updateUserRole)
api.put('/editUserInfo/:id', [validateJwt, isAdmin], editUserInfo)
api.put('/editUserInfoClient/:id',[validateJwt], editUserInfoClient)

export default api