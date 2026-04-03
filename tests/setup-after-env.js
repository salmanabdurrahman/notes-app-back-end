import { afterAll } from '@jest/globals';
import authenticationRepository from '../src/modules/authentications/authentications.repository.js';
import collaborationRepository from '../src/modules/collaborations/collaborations.repository.js';
import noteRepository from '../src/modules/notes/notes.repository.js';
import userRepository from '../src/modules/users/users.repository.js';
import { closeTestDatabase } from './helpers/database.js';

afterAll(async () => {
  await Promise.allSettled([
    noteRepository.close(),
    collaborationRepository.close(),
    userRepository.close(),
    authenticationRepository.close(),
    closeTestDatabase(),
  ]);
});
