"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insight_controller_1 = require("../controllers/insight.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJwt);
router.get('/', insight_controller_1.insightController.getInsights);
exports.default = router;
