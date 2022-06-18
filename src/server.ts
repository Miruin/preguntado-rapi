import express from 'express'
import cors from 'cors'
import passport from 'passport';

import config from './config';
import middleware from './middlewares/auth';
import rutausuario from './routes/usuario'


class server {

    app: express.Application;

    constructor(){

        this.app = express();
        this.config();
        this.routes();

    }

    config() {

        this.app.set('port', config.port);
       

        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json());
        this.app.use(passport.initialize());
        this.app.use(cors());
        
        passport.use(middleware); 
        
    }

    routes() {

        this.app.use(rutausuario)

    }
    
    start() {

        this.app.listen(this.app.get('port'), () => {

            console.log('El servidor esta corriendo en el puerto: ', this.app.get('port'));
            
        });
    }

}

const serv = new server();
serv.start();