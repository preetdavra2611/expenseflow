"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const config_1 = require("../config");
const types_1 = require("../types");
class CategoryController {
    async getCategories(req, res, next) {
        try {
            const type = req.query.type;
            const where = {
                userId: req.user.id,
            };
            if (type) {
                where.type = type;
            }
            let categories = await config_1.prisma.category.findMany({
                where,
                orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            });
            if (categories.length === 0) {
                const { authService } = await Promise.resolve().then(() => __importStar(require('../services/auth.service')));
                await authService.seedUserDefaultCategories(req.user.id);
                categories = await config_1.prisma.category.findMany({
                    where,
                    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
                });
            }
            res.json({ success: true, categories });
        }
        catch (err) {
            next(err);
        }
    }
    async createCategory(req, res, next) {
        try {
            const data = types_1.CategorySchema.parse(req.body);
            const category = await config_1.prisma.category.create({
                data: {
                    userId: req.user.id,
                    name: data.name,
                    type: data.type,
                    icon: data.icon,
                    color: data.color,
                    isDefault: false,
                },
            });
            res.status(201).json({ success: true, category });
        }
        catch (err) {
            next(err);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const data = types_1.CategorySchema.partial().parse(req.body);
            const category = await config_1.prisma.category.updateMany({
                where: { id, userId: req.user.id },
                data,
            });
            res.json({ success: true, category });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            // Check if transactions exist for this category
            const txCount = await config_1.prisma.transaction.count({
                where: { categoryId: id, userId: req.user.id },
            });
            if (txCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category with ${txCount} existing transactions. Reassign them first.`,
                });
            }
            await config_1.prisma.category.deleteMany({
                where: { id, userId: req.user.id },
            });
            res.json({ success: true, message: 'Category deleted successfully' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
