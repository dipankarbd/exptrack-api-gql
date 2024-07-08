import express, { Router, Request, Response } from 'express';

import { Repository, RoleType } from '../repository';
import { generatePassword } from '../utils';

export const createUserRouter = (repository: Repository): Router => {
  const router = express.Router();

  router.post(
    '/register',
    async (req: Request, res: Response): Promise<void> => {
      const role = 'Basic';
      const email = req.body.email;
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      const password = req.body.password;

      const hashObj = generatePassword(password);

      const user = {
        role: role as RoleType,
        email: email,
        firstName: firstName,
        lastName: lastName,
        salt: hashObj.salt,
        hash: hashObj.hash,
      };

      if (await repository.getUserByEmail(email)) {
        res.status(409).json('User already exists!');
        return;
      }

      const resp = await repository.createUser(user);
      res.status(201).json(resp);
    },
  );

  return router;
};
