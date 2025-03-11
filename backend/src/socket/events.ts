import boardEvents from './events/board.events';
import postEvents from './events/post.events';
import workflowEvents from './events/workflow.events';
import notificationEvents from './events/notification.events';
import bucketEvents from './events/bucket.events';
import groupEvents from './events/group.events';
import aiEvents from './events/ai.events';
import roomcastEvents from './events/roomcast.events';

const events = [
  ...postEvents,
  ...boardEvents,
  ...workflowEvents,
  ...notificationEvents,
  ...bucketEvents,
  ...aiEvents,
  ...groupEvents,
  ...roomcastEvents,
];

export default events;
