import { Router } from 'express';
import { getRooms, getRoomByNumber, updateRoomStatus } from './roomsController.js';

const router = Router();

router.get('/', getRooms);
router.get('/:number', getRoomByNumber);
router.patch('/:number/status', updateRoomStatus);

export default router;
