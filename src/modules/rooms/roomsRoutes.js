import { Router } from 'express';
import { optionalAuth } from '../../middlewares/auth.js';
import { getRooms, getRoomByNumber, updateRoomStatus } from './roomsController.js';

const router = Router();
router.use(optionalAuth);

router.get('/', getRooms);
router.get('/:number', getRoomByNumber);
router.patch('/:number/status', updateRoomStatus);

export default router;
