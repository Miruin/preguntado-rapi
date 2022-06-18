"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const controlUser_1 = __importDefault(require("../controllers/controlUser"));
const auth = passport_1.default.authenticate("jwt", { session: false });
const optionalAuth = (req, res, next) => {
    if (req.headers["authorization"]) {
        auth(req, res, next);
    }
    else
        next();
};
class Usuario {
    constructor() {
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes() {
        this.router.post('/registro', controlUser_1.default.reguser);
        this.router.post('/log', controlUser_1.default.login);
        this.router.get('/log', optionalAuth, controlUser_1.default.logout);
        this.router.put('/score', optionalAuth, controlUser_1.default.salvarScore);
        this.router.get('/datos', optionalAuth, controlUser_1.default.datosuser);
    }
}
const rutausuario = new Usuario();
exports.default = rutausuario.router;
