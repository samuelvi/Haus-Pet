import { createSystemCountersRouter } from './system-counters.router';
import { container } from '../../../infrastructure/di/container';
import { TYPES } from '../../../infrastructure/di/types';
import { SystemCountersController } from '../../../infrastructure/http/controllers/system-counters.controller';

// Get controller from DI container
const systemCountersController = container.get<SystemCountersController>(TYPES.SystemCountersController);

// Export configured router
export default createSystemCountersRouter(systemCountersController);
