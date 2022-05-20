import boardEvents from "./events/board.events";
import postEvents from "./events/post.events";
import workflowEvents from "./events/workflow.events";
import notificationEvents from "./events/notification.events";

const events = [
  ...postEvents,
  ...boardEvents,
  ...workflowEvents,
  ...notificationEvents,
];

export default events;
