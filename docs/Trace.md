# Trace Documentation

### What is trace?

Trace logs all user activity on boards. This data is exported to csv.

### How to create a new trace

1. create a new SocketEvent in constants.ts on frontend and backend
2. On frontend emit that event along with a payload
   `this.socketService.emit(SocketEvent.EVENT_NAME, PAYLOAD)`
3. On backend create an event handler in `socket/events` and follow the conventions of the other event handlers
4. On backend create a trace handler in `socket/trace` and follow the conventions of the other trace handlers
5. In the `handleEvent` function in your event handler involk your trace handler
6. On frontend add the fields of your trace event object to `traceDefaults.ts` in the `csv-download-button` folder. Set any labels or defaults as needed.

### Areas of improvment

- reduce the number of db queries for each trace
- currently all trace data is being exported
  - not ideal for large amounts of data as its all being done on client side currently
  - allow user to select date range and other options
  - move data csv conversion to server side to be completed in background

### Resources

- [json2csv](https://www.npmjs.com/package/json2csv)
