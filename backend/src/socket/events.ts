import boardEvents from "./events/board.events";
import postEvents from "./events/post.events";

const events = [
  ...postEvents, 
  ...boardEvents
]

export default events;