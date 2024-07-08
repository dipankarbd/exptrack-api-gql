import express, { Router, Request, Response } from 'express';

import { Repository } from '../repository';
import { generateToken, varifyPassword } from '../utils';

export const createAuthRouter = (repository: Repository): Router => {
  const router = express.Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const user = await repository.getUserByEmail(req.body.email);

    if (user) {
      const valid = varifyPassword(req.body.password, user.hash, user.salt);
      if (valid) {
        const token = generateToken(user.id);
        res.json(token);
      } else {
        res.status(401).json({ error: 'Wrong username or password' });
      }
    } else {
      res.status(401).json({ error: 'Wrong username or password' });
    }
  });

  return router;
};
