const mongoose = require('mongoose');


/*
Group 1: view, click, purchase, wishlist, add_to_cart
    behavior(user, action, product, timestamps)
Group 2: search
    behavior(user, action, searchQuery, timestamps)
*/

const behaviorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            enum: ['view', 'click', 'add_to_cart', 'purchase', 'search', 'wishlist'],
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        searchQuery: {
            type: String,
        }
    }, { timestamps: true }
);

behaviorSchema.index({ user: 1, action: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('Behavior', behaviorSchema);