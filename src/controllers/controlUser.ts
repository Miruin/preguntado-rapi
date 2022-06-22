import { Request, Response} from 'express';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from "../config";
import { getcon, getdatosuser } from '../db';

function tokenUser(id: any) {
    if (!config.secrettoken) return "ERROR en token" 
    return "Bearer "+jwt.sign(id, config.secrettoken);
}

class Controllersuser {

    constructor() {
        
    }

    async reguser (req: Request, res: Response): Promise<any>{
       
        try {

            const pool = await getcon();

            let { name, password} = req.body;
            
            if(name == null || password == null) {
    
                return res.status(400).json({ msg : 'No se han llenado los valores correctamente'});
    
            } else {

                const result = await getdatosuser(pool, name);

                if (result.recordset[0]) { 
                        
                    pool.close();
                    return res.status(400).send({msg: 'Ya se esta usando este usuario'});

                } else {
    
                    let rondas = 10;
                    let pwh = await bcrypt.hash(password,rondas);
                    await pool.request()
                    .input('nick', sql.VarChar, name)
                    .input('pw', sql.VarChar, pwh)
                    .query(String(config.q1));

                    pool.close();
                    return res.status(200).send({msg: 'Se ha registrado satisfactoriamente'});
                    
                }

            }
    
        } catch(e) {

            console.error(e);
            return res.status(500).send({msg: 'Error en el servidor'});

        }
    }
      
    async login(req: Request, res: Response): Promise<any> {
    
        try {
        
            const pool = await getcon();
    
            let { name, password} = req.body;
    
            if (name == null || password == null) {
    
                return res.status(400).send({ msg : 'No se han llenado los valores correctamente'});
                
            } else {
                
                const result = await getdatosuser(pool, name);
    
                if (result.recordset[0]) {
    
                    const pwv = await bcrypt.compare(password, result.recordset[0].pw_usuario);
    
                    if (pwv) {
    
                        pool.close();
                        return res.status(200).send({token: tokenUser(result.recordset[0].name_usuario), msg: 'Se ha iniciado secion satisfactoriamente', nickname: name});
                        
                    } else {

                        pool.close();
                        return res.status(200).send({msg: 'La contrasena no coincide'});

                    }
    
                } else {

                    pool.close();
                    return res.status(200).send({msg: 'No se ha encontrado el usuario'});

                }
    
                
    
            }
            
        } catch (error) {
            
            console.error(error);
            return res.status(500).send({msg: 'Error en el servidor'});
    
        }
    
    }
    
    async datosuser(req: Request, res: Response): Promise<any> {
    
        try {
    
            const pool = await getcon();

            const result = await getdatosuser(pool, String(req.user));
    
            let nick = result.recordset[0].name_usuario;
            let scorerush = result.recordset[0].score_rush_usuario;
            let scorenormal = result.recordset[0].score_normal_usuario;
    
            pool.close();
            
            return res.status(200).send({nick, scorenormal, scorerush});
            
        } catch (error) {
    
            console.error(error);
            return res.status(500).send({msg: 'Error en el servidor'});
            
        }
    }
    
    async salvarScore(req: Request, res: Response): Promise<any>{

        try {

            let { recordscore, modo } = req.body;
            
            if(!recordscore && !modo) return res.status(400).send({msg: 'ERROR no hay score que salvar'})
            if(!req.user) return res.status(400).send({msg: 'ERROR no hay nadie con sesion activa'})

            const pool = await getcon();

            const result = await getdatosuser(pool, String(req.user));

            let {score_normal_usuario, score_rush_usuario} = result.recordset[0];

            if (modo == 'rush') {

                if (score_rush_usuario >= recordscore) 
                return res.status(200).send({msg: 'tienes un mejor record'})

                await pool.request()
                .input('score', sql.Int, recordscore)
                .input('nickname', req.user)
                .query(String(config.q3));

                pool.close();
                return res.status(200).send({msg: 'el score de modo rush se ha salvado'})
                
            }
            
            let scoreupdate = Number(recordscore) + Number(score_normal_usuario);
            
            await pool.request()
            .input('score', sql.Int, scoreupdate)
            .input('nickname', req.user)
            .query(String(config.q4));

             pool.close();
            return res.status(200).send({msg: 'el score de modo normal se ha salvado'})
            
        } catch (error) {

            console.error(error);

            return res.status(500).send({msg: 'Error en el servidor'});
            
            
        }
    }
     
    async logout(req: Request, res: Response): Promise<any> {

        try {

            const pool = await getcon();

            const result = await getdatosuser(pool, String(req.user));
        
            if (result.recordset[0]) {
        
                return res.status(200).send({msg: 'Tienes permiso para deslogearte'});
        
            } else {
        
                return res.status(500).send({msg: 'No se encuentra este usuario en la DB'});
        
            }
            
        } catch (error) {

            console.error(error);
            return res.status(500).send({msg: 'Error en el servidor'});
            
        }
        
    }
    
}

const controlUser = new Controllersuser();

export default controlUser;