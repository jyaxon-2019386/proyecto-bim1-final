'use strict'

import PDFDocument from 'pdfkit';
import fs from 'fs';

import Invoice from '../invoice/invoice.model.js'
import User from  '../users/user.model.js'
import Product from '../products/product.model.js'
import Cart from '../invoice/cart.model.js'
import jwt from 'jsonwebtoken';

export const saveCart = async (req, res) => {
    try {
        const { user, products } = req.body;

        // Validar si el usuario existe
        const userExists = await User.findById(user);
        if (!userExists) {
            return res.status(404).send({ message: 'User not found' });
        }

        let totalAmount = 0;

        // Validar si los productos existen y actualizar el stock
        for (const productId of products) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send({ message: 'Product not found' });
            }
            if (product.stock < 1) {
                return res.status(400).send({ message: 'Insufficient stock for product' });
            }
            product.stock -= 1; // Restar 1 al stock por cada producto agregado al carrito
            totalAmount += product.price; // Sumar el precio del producto al totalAmount
            await product.save();
        }

        // Crear el carrito de compras con el totalAmount calculado
        const cart = new Cart({
            user: user,
            products: products,
            totalAmount: totalAmount
        });
        await cart.save();

        // Crear la factura basada en el carrito de compras
        const invoice = new Invoice({
            user: user,
            products: products,
            totalAmount: totalAmount,
            price: totalAmount // Precio total igual al totalAmount
        });
        await invoice.save();

        return res.status(201).send({ message: 'Cart saved and invoice created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error saving cart and creating invoice', error });
    }
}

export const removeProductFromCart = async (req, res) => {
    try {
        const { cartId, productId } = req.body;

        // Obtener el token del encabezado de autorización
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Decodificar el token y obtener el ID del usuario
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.uid;

        // Validar si el carrito pertenece al usuario actual
        const cart = await Cart.findOne({ _id: cartId, user: userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found for the user' });
        }

        // Verificar si el producto a eliminar está en el carrito
        if (!cart.products.includes(productId)) {
            return res.status(404).send({ message: 'Product not found in the cart' });
        }

        // Eliminar el producto del carrito y actualizar el totalAmount
        cart.products = cart.products.filter(id => id.toString() !== productId.toString());

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        product.stock += 1; // Incrementar el stock al eliminar el producto del carrito
        await product.save();

        cart.totalAmount -= product.price; // Restar el precio del producto eliminado al totalAmount
        await cart.save();

        return res.send({ message: 'Product removed from cart successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error removing product from cart', error });
    }
};

// Función para editar una factura
export const editInvoice = async (req, res) => {
    try {
        const { invoiceId, user, products, totalAmount, price } = req.body;

        // Validar si la factura existe
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).send({ message: 'Invoice not found' });
        }

        // Actualizar los datos de la factura con los nuevos valores
        invoice.user = user;
        invoice.products = products;
        invoice.price = price;
        invoice.totalAmount = totalAmount;

        // Calcular el totalAmount basado en los precios de los productos
        let calculatedTotalAmount = 0;
        for (const productData of products) {
            const product = await Product.findById(productData);
            if (product) {
                calculatedTotalAmount += product.price;
            }
        }
        
        // Actualizar el totalAmount con el cálculo basado en los precios de los productos
        invoice.totalAmount = calculatedTotalAmount;

        await invoice.save();

        return res.status(200).send({ message: 'Invoice updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error updating invoice', error });
    }
};


export const getUserInvoices = async (req, res) => {
    try {
        const id = req.params.id;

        // Validar si el ID del usuario es válido
        if (!id) {
            return res.status(400).send({ message: 'Invalid user ID' });
        }

        // Buscar las facturas del usuario
        const userInvoices = await Invoice.find({ user: id })
            .populate({ path: 'user', select: 'name' })
            .populate({ path: 'products', select: 'name' });

        // Verificar si se encontraron facturas para el usuario
        if (!userInvoices || userInvoices.length === 0) {
            return res.status(404).send({ message: 'No invoices found for this user' });
        }

        return res.status(200).send({ invoices: userInvoices });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error fetching user invoices', error });
    }
};

export const exportInvoiceToPDF = async (req, res) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.uid;

        const { invoiceId } = req.body;

        const userInvoice = await Invoice.findOne({ user: userId, _id: invoiceId })
            .populate('user')
            .populate({
                path: 'products',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            });

        if (!userInvoice) {
            return res.status(404).send({ message: 'Invoice not found for this user' });
        }

        const doc = new PDFDocument();
        const pdfFilePath = `invoices/invoice_${userInvoice.user.username}.pdf`;
        doc.pipe(fs.createWriteStream(pdfFilePath));

        // Agregar logo en la parte superior derecha
        const logoPath = 'D:/6to Perito/1er Bimestre/onlineStoreVF/img/img.jpg'; 
        doc.image(logoPath, 400, 30, { width: 150 });

        // Establecer el formato y diseño de la factura
        doc.fontSize(24);
        doc.font('Helvetica-Bold');
        doc.text('Invoice', { align: 'center' });
        doc.moveDown();

       // Cuerpo del documento
       doc.fontSize(14);
       doc.font('Helvetica-Bold');
       doc.text('Username: ', { continued: true });
       doc.font('Helvetica');
       doc.text(`${userInvoice.user.username}`);

       doc.font('Helvetica-Bold');
       doc.text('Name and surname: ', { continued: true });
       doc.font('Helvetica');
       doc.text(`${userInvoice.user.name} ${userInvoice.user.surname}`);

       doc.font('Helvetica-Bold');
       doc.text('Phone: ', { continued: true });
       doc.font('Helvetica');
       doc.text(`${userInvoice.user.phone}`);

       doc.font('Helvetica-Bold');
       doc.text('Email: ', { continued: true });
       doc.font('Helvetica');
       doc.text(`${userInvoice.user.email}`);

       doc.font('Helvetica-Bold');
       doc.text('Date: ', { continued: true });
       doc.font('Helvetica');
       doc.text(`${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`);
       doc.moveDown();

       doc.font('Helvetica-Bold');
       doc.text('Products:');
       doc.moveDown();
   
       // Listar los productos de la factura con sus categorías
       userInvoice.products.forEach((product, index) => {
           doc.text(`${index + 1}. ${product.name} | Price: $${product.price} | Category: ${product.category.name}`);
           doc.moveDown();
       });
   
       // Mostrar el total de la factura
       doc.fontSize(16);
       doc.font('Helvetica-Bold');
       doc.text(`Total Amount: $${userInvoice.totalAmount}`);

       // Mensaje de pie de página
       doc.fontSize(8);
       doc.font('Helvetica-Bold');
       doc.text('Thank you for your purchase.', { align: 'center' });

       // Finalizar y cerrar el documento PDF
       doc.end();

         return res.status(200).send({ message: 'Invoice exported to PDF successfully', pdfFilePath });
     } catch (error) {
         console.error(error);
         return res.status(500).send({ message: 'Error exporting invoice to PDF', error });
     }
};

export const getPurchaseHistory = async (req, res) => {
    try {
        // Obtener el token del encabezado de autorización
        const token = req.headers.authorization;
        
        if (!token) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Decodificar el token y obtener el ID del usuario
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.uid;

        // Obtener el historial de compras del usuario basado en las facturas asociadas
        const invoices = await Invoice.find({ user: userId });
        
        return res.status(200).send({ purchaseHistory: invoices });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error retrieving purchase history', error });
    }
};





