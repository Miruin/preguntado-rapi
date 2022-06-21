"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config"));
const db_1 = require("../db");
function tokenUser(id) {
    if (!config_1.default.secrettoken)
        return "ERROR en token";
    return "Bearer " + jsonwebtoken_1.default.sign(id, config_1.default.secrettoken);
}
class Controllersuser {
    constructor() {
    }
    reguser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield (0, db_1.getcon)();
                let { name, password } = req.body;
                if (name == null || password == null) {
                    return res.status(400).json({ msg: 'No se han llenado los valores correctamente' });
                }
                else {
                    const result = yield (0, db_1.getdatosuser)(pool, name);
                    if (result.recordset[0]) {
                        pool.close();
                        return res.status(400).send({ msg: 'Ya se esta usando este usuario' });
                    }
                    else {
                        let rondas = 10;
                        let pwh = yield bcrypt_1.default.hash(password, rondas);
                        yield pool.request()
                            .input('nick', mssql_1.default.VarChar, name)
                            .input('pw', mssql_1.default.VarChar, pwh)
                            .query(String(config_1.default.q1));
                        pool.close();
                        return res.status(200).send({ msg: 'Se ha registrado satisfactoriamente' });
                    }
                }
            }
            catch (e) {
                console.error(e);
                return res.status(500).send({ msg: 'Error en el servidor' });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield (0, db_1.getcon)();
                let { name, password } = req.body;
                if (name == null || password == null) {
                    return res.status(400).send({ msg: 'No se han llenado los valores correctamente' });
                }
                else {
                    const result = yield (0, db_1.getdatosuser)(pool, name);
                    if (result.recordset[0]) {
                        const pwv = yield bcrypt_1.default.compare(password, result.recordset[0].pw_usuario);
                        if (pwv) {
                            pool.close();
                            return res.status(200).send({ token: tokenUser(result.recordset[0].name_usuario), msg: 'Se ha iniciado secion satisfactoriamente', nickname: name });
                        }
                        else {
                            pool.close();
                            return res.status(200).send({ msg: 'La contrasena no coincide' });
                        }
                    }
                    else {
                        pool.close();
                        return res.status(200).send({ msg: 'No se ha encontrado el usuario' });
                    }
                }
            }
            catch (error) {
                console.error(error);
                return res.status(500).send({ msg: 'Error en el servidor' });
            }
        });
    }
    datosuser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield (0, db_1.getcon)();
                const result = yield (0, db_1.getdatosuser)(pool, String(req.user));
                let nick = result.recordset[0].name_usuario;
                let scorerush = result.recordset[0].score_rush_usuario;
                let scorenormal = result.recordset[0].score_normal_usuario;
                pool.close();
                return res.status(200).send({ nick, scorenormal, scorerush });
            }
            catch (error) {
                console.error(error);
                return res.status(500).send({ msg: 'Error en el servidor' });
            }
        });
    }
    salvarScore(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { recordscore, modo } = req.body;
                if (!recordscore && !modo)
                    return res.status(400).send({ msg: 'ERROR no hay score que salvar' });
                if (!req.user)
                    return res.status(400).send({ msg: 'ERROR no hay nadie con sesion activa' });
                const pool = yield (0, db_1.getcon)();
                const result = yield (0, db_1.getdatosuser)(pool, String(req.user));
                let { score_normal_usuario, score_rush_usuario } = result.recordset[0];
                if (modo == 'rush') {
                    if (score_rush_usuario >= recordscore)
                        return res.status(200).send({ msg: 'tienes un mejor record' });
                    yield pool.request()
                        .input('score', mssql_1.default.Int, recordscore)
                        .input('nickname', req.user)
                        .query(String(config_1.default.q3));
                    pool.close();
                    return res.status(200).send({ msg: 'el score de modo rush se ha salvado' });
                }
                let scoreupdate = Number(recordscore) + Number(score_normal_usuario);
                yield pool.request()
                    .input('score', mssql_1.default.Int, scoreupdate)
                    .input('nickname', req.user)
                    .query(String(config_1.default.q4));
                pool.close();
                return res.status(200).send({ msg: 'el score de modo normal se ha salvado' });
            }
            catch (error) {
            }
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield (0, db_1.getcon)();
                const result = yield (0, db_1.getdatosuser)(pool, String(req.user));
                if (result.recordset[0]) {
                    return res.status(200).send({ msg: 'Tienes permiso para deslogearte' });
                }
                else {
                    return res.status(500).send({ msg: 'No se encuentra este usuario en la DB' });
                }
            }
            catch (error) {
                console.error(error);
                return res.status(500).send({ msg: 'Error en el servidor' });
            }
        });
    }
}
const controlUser = new Controllersuser();
exports.default = controlUser;
