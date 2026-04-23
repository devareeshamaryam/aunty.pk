"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });
productSchema.index({ slug: 1 });
productSchema.index({ isFeatured: 1 });
exports.Product = (0, mongoose_1.model)('Product', productSchema);
//# sourceMappingURL=product.schema.js.map