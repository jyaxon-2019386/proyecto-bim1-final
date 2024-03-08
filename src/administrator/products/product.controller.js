'use strict'

import Product from './product.model.js'
import Category from '../categories/category.model.js'
import Cart from '../products/product.model.js'
import { checkUpdate } from '../../utils/validator.js'

export const test = (req, res) => {
    console.log('test is running')
    return res.send({message: 'Test is running'})
}

// Save a new product
export const save = async (req, res) => {
    try {
        const { name, price, category, stock } = req.body;

        const products = new Product({ name, price, category, stock });
        await products.save();

        const categories = await Category.findById(category);
        
        if (!categories) {
            return res.status(404).send({ message: 'Category not found' });
        }

        return res.send({ message: `Saved successfully ${products.name} in ${categories.name}` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error saving product!', err: err });
    }
};

// Get products
export const get = async (req, res) => {
    try {
        let product = await Product.find().populate({path: 'category', select: 'name -_id'})
        return res.send({ product })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error getting products!' })
    }
}

// Get products of stock
export const getOfStock = async (req, res) => {
    try {
        let outOfStockProducts = await Product.find({ stock: 0 }).populate({path: 'category', select: 'name -_id'})
        return res.send({ message: 'Products of stock!', products: outOfStockProducts })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error getting out of stock products!' })
    }
};
// View the catalogue complete
export const viewCatalogue = async (req, res) => {
    try {
        let products = await Product.find({}).populate({path: 'category', select: 'name -_id'})
        return res.send({ products })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error getting products' })
    }
}

// Update a product
export const update = async (req, res) => {
    try {
        let data = req.body
        let { id } = req.params
        let update = checkUpdate(data, false)
        if (!update) return res.status(400).send({ message: 'Have submitted some data that cannot be updated or missing data' })
        let updatedProduct = await Product.findOneAndUpdate(
            {_id: id},
            data,
            {new: true}
             ) 
        if(!updatedProduct) return res.status(404).send({message: 'Product not found and not updated'})
        return res.send({message: 'Product updated successfully! 😀', updatedProduct})
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error updating product' })
    }
}

// Delete a product
export const deleteP = async(req, res)=>{
    try{
        let { id } = req.params
        let deletedProduct = await Product.deleteOne({_id: id})
        if(deletedProduct.deletedCount === 0) return res.status(404).send({message: 'Product not found and not deleted'})
        return res.send({message: 'Deleted product successfully! 😀'})
    }catch(err){
        console.error(err)
        return res.status(404).send({message: 'Error deleting product!'})
    }
}

// Search a product
export const search = async(req, res)=>{
    try{
        let { search } = req.body
        let product = await Product.find({name: search}).populate({path: 'category', select: 'name -_id'})
        if(!product) return res.status(404).send({message: 'Product not found! 😥'})
        return res.send({message: 'Product found! 😀', product})
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Error searching products'})
    }
}

export const getTopSellingProducts = async (req, res) => {
    try {
        const lowStockProducts = await Product.find().populate({path: 'category', select: 'name -_id'}).sort({ stock: 1 }).limit(5);
        
        return res.status(200).json({ lowStockProducts });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error retrieving low stock products', error });
    }
}