import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    name: {
        type: String 
    },
    mob: {
        type: String    
    },
    message: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }
})

const Comment = mongoose.model("Comment", commentSchema)

export default Comment