import { onboardingService } from './onboardingService.js';
import { errorResponse, successResponse } from '../../utils/response.js';

export const getOnboardingStatus = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId || 'hotel-mercier';
    const status = await onboardingService.getStatus(hotelId);
    return successResponse(res, status, 'Onboarding status retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updateOnboardingStatus = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId || 'hotel-mercier';
    const updated = await onboardingService.updateStatus(hotelId, req.body);
    return successResponse(res, updated, 'Onboarding status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
