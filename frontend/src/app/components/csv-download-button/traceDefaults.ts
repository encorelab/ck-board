/**
 * value: field name
 * label: field name that appears in csv file (omit if same as value)
 * default: default value for field if not defined
 */
export default [
  {
    value: '_id',
    label: 'eventLogID',
    default: '',
  },
  {
    value: 'projectID',
    default: '',
  },
  {
    value: 'projectName',
    default: '',
  },
  {
    value: 'boardID',
    default: '',
  },
  {
    value: 'boardName',
    default: '',
  },
  {
    value: 'agentUserID',
    default: '',
  },
  {
    value: 'agentUserName',
    default: '',
  },
  {
    value: 'eventType',
    default: '',
  },
  {
    value: 'updatedAt',
    label: 'serverTimestamp',
    default: -1,
  },
  {
    value: 'clientTimestamp',
    default: -1,
  },
  {
    value: 'postID',
    default: '',
  },
  {
    value: 'postModifiedTitle',
    default: '',
  },
  {
    value: 'postModifiedMessage',
    default: '',
  },
  {
    value: 'postTitleOrMessageModifiedCounter',
    default: 0,
  },
  {
    value: 'commentID',
    default: '',
  },
  {
    value: 'commentModifiedText',
    default: '',
  },
  {
    value: 'postModifiedUpvote',
    default: 0,
  },
  {
    value: 'postTagNameAdded',
    default: '',
  },
  {
    value: 'postTagNameRemoved',
    default: '',
  },
  {
    value: 'postModifiedLocationX',
    default: null,
  },
  {
    value: 'postModifiedLocationY',
    default: null,
  },
  {
    value: 'postDeleted',
    default: 0,
  },
  {
    value: 'postMovedToBucketID',
    default: '',
  },
  {
    value: 'postMovedToBucketName',
    default: '',
  },
  {
    value: 'postRemovedFromBucketID',
    default: '',
  },
  {
    value: 'postRemovedFromBucketName',
    default: '',
  },
  {
    value: 'postRead',
    default: 0,
  },
];
