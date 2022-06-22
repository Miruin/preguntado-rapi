import { Router, Request, Response } from 'express';
import passport from 'passport';

import controlUser from '../controllers/controlUser';

const auth = passport.authenticate("jwt", { session: false });

const optionalAuth = (req: Request, res: Response, next: () => void) => {
  if (req.headers["authorization"]) {
    
    auth(req, res, next);
  } else next();
};

class Usuario{

    router: Router;

    constructor() {

        this.router = Router();      
        this.routes();

    }

    routes() {
        
        this.router.post('/registro', controlUser.reguser);

        this.router.post('/log', controlUser.login);

        this.router.get('/log', optionalAuth, controlUser.logout);

        this.router.put('/score', optionalAuth, controlUser.salvarScore);

        this.router.get('/datos', optionalAuth, controlUser.datosuser);

    }
 
}

const rutausuario = new Usuario();

export default rutausuario.router;