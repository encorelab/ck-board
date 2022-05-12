import boardEvents from "./events/board.events";
import postEvents from "./events/post.events";
import workflowEvents from "./events/workflow.events";

const events = [...postEvents, ...boardEvents, ...workflowEvents];

export default events;
