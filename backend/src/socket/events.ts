import boardEvents from './events/board.events';
import postEvents from './events/post.events';
import workflowEvents from './events/workflow.events';
import notificationEvents from './events/notification.events';
import bucketEvents from './events/bucket.events';
import aiEvents from './events/ai.events'; // Import the new aiEvents
import groupEvents from './events/group.events';

const events = [
  ...postEvents,
  ...boardEvents,
  ...workflowEvents,
  ...notificationEvents,
  ...bucketEvents,
  ...aiEvents,
  ...groupEvents,
];

export default events;
