'use strict'

import jwt from 'jsonwebtoken'
import User from '../administrator/users/user.model.js'

export const validateJwt = async(req, res, next)=>{
    try{
        //Obtener la llave de acceso al token
        let secretKey = process.env.SECRET_KEY
        //obtener el token de los headers
        let {authorization } = req.headers
        //Verificar si viene el token
        if(!authorization) return res.status(401).send({message: 'Unauthorized'})
        //Obtener el uid del usuario que envió el token
        let { uid } = jwt.verify(authorization, secretKey)
        //Validar si aún existe en la BD
        let user = await User.findOne({_id: uid})
        if(!user) return res.status(404).send({message: 'User not found - Unauthorized'})
        req.user = user
        next()
    }catch(err){
        console.error(err)
        return res.status(401).send({message: 'Invalid token'})
    }
}

export const isAdmin = async(req, res, next)=>{
    try{
        let { user } = req
        if(!user || user.role !== 'ADMIN_ROLE') return res.status(403).send({message: `You dont have access | username: ${user.username} | role: ${user.role}`})
        next()
    }catch(err){
        console.error(err)
        return res.status(403).send({message: 'Unauthorized role'})
    }
}

export const isClient = async(req, res, next)=>{
    try{
        let { user } = req
        if(!user || user.role !== 'CLIENT_ROLE') return res.status(403).send({message: `You dont have access`})
        next()
    }catch(err){
        console.error(err)
        return res.status(403).send({message: 'Unauthorized role'})
    }
}

export const authorizeDeleteUser = (req, res, next) => {
    try {
        // Obtener el ID del usuario a eliminar y el ID del usuario autenticado
        const userIdToDelete = req.params.id;
        const authenticatedUserId = req.user._id.toString();
        
        // Verificar si el usuario autenticado tiene permiso para eliminar el perfil
        if (userIdToDelete === authenticatedUserId) {
            // El usuario puede eliminar su propio perfil
            next(); // Continuar con la siguiente función en la ruta
        } else {
            return res.status(403).send({ message: 'No tienes permiso para eliminar este perfil' }); // status 403 Forbidden
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error de autorización' }); // status 500 Internal Server Error
    }
}
