'use strict'

import Category from './category.model.js'
import Product from '../products/product.model.js'
import { checkUpdate } from '../../utils/validator.js'

export const test = (req, res) => {
    console.log('test is running')
    return res.send({message: 'Test is running'})
}

// Save a new category
export const save = async(req, res)=>{
    try{
        let data = req.body
        let category = new Category(data)
        await category.save()
        return res.send({message: `Saved successfully ${category.name}`})
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Error saving category!', err: err})
    }
}

// Get categories
export const get = async (req, res) => {
    try {
        let category = await Category.find()
        return res.send({ category })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error getting categories!' })
    }
}

// Update a category
export const update = async (req, res) => {
    try {
        let data = req.body
        let { id } = req.params
        let update = checkUpdate(data, false)
        if (!update) return res.status(400).send({ message: 'Have submitted some data that cannot be updated or missing data' })
        let updatedCategory = await Category.findOneAndUpdate(
            {_id: id},
            data,
            {new: true}
             ) 
        if(!updatedCategory) return res.status(404).send({message: 'Category not found and not updated'})
        return res.send({message: 'Category updated successfully! 😀', updatedCategory})
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error updating category!' })
    }
}

// Delete a category
export const deleteC = async (req, res) => {
    try {
        let { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).send({ message: 'Category not found and not deleted' });
        }

        const productsToUpdate = await Product.find({ category: id });

        if (productsToUpdate.length > 0) {
            let defaultCategory = await Category.findOne({ name: 'Default' });

            if (!defaultCategory) {
                defaultCategory = await Category.create({ name: 'Default' });
            }

            for (const product of productsToUpdate) {
                product.category = defaultCategory._id;
                await product.save();
            }
        }

        await Category.deleteOne({ _id: id });

        return res.send({ message: 'Deleted category successfully! 😀' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error deleting category!' });
    }
}

// Search a category
export const search = async(req, res)=>{
    try{
        let { search } = req.body
        let category = await Category.find({name: search})
        if(!category) return res.status(404).send({message: 'Category not found! 😥'})
        return res.send({message: 'Category found! 😀', category})
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Error searching categories'})
    }
}