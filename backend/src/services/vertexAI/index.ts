import dalVote from '../../repository/dalVote';
import dalBucket from '../../repository/dalBucket';
import dalChatMessage from '../../repository/dalChatMessage';
import { BucketModel } from '../../models/Bucket';
import { generateUniqueID } from '../../utils/Utils';
import dalPost from '../../repository/dalPost';
import { PostType } from '../../models/Post';
import * as socketIO from 'socket.io';
import { SocketEvent } from '../../constants';
import * as dotenv from 'dotenv';
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';
import { EndpointServiceClient } from '@google-cloud/aiplatform';
import * as fs from 'fs';

global.Headers = Headers;

dotenv.config();

interface AIResponse {
  response: string;
  create_bucket?: { name: string }[];
  add_post_to_bucket?: { postID: string; bucketID: string }[];
  remove_post_from_bucket?: { postID: string; bucketID: string }[];
  add_to_canvas?: { postID: string }[];
  remove_from_canvas?: { postID: string }[];
  create_bucket_and_add_posts?: { name: string; postIDs: string[] }[];
}

type ErrorInfo = {
  code?: number;
  message?: string;
};

const clientOptions = {
  apiEndpoint: 'northamerica-northeast1-aiplatform.googleapis.com',
};

// Function to check for keyfile and its content
function checkKeyFile(keyfilePath: string): boolean {
  if (!fs.existsSync(keyfilePath)) {
    console.error(`Error: The file at "${keyfilePath}" does not exist.`);
    return false;
  }

  try {
    const keyfileContent = fs.readFileSync(keyfilePath, 'utf-8');
    const parsedContent = JSON.parse(keyfileContent);

    if (parsedContent) {
      console.log('Found GOOGLE_APPLICATION_CREDENTIALS keyfile contents.');
    }

    if (!parsedContent.client_email || !parsedContent.private_key) {
      console.error(
        `Error: The file at "${keyfilePath}" does not contain valid credentials.`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Error: Could not read or parse the file at "${keyfilePath}".`,
      error
    );
    return false;
  }
}

// Check the keyfile before initializing the client
const keyfilePath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || './secrets/keyfile.json';
checkKeyFile(keyfilePath);

// Function to initialize the EndpointServiceClient with delayed checking
let client: EndpointServiceClient | null = null;
async function getEndpointServiceClient(): Promise<EndpointServiceClient> {
  if (client) {
    return client;
  }

  // Wait for 3 seconds before the first attempt
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!fs.existsSync(keyfilePath)) {
    console.log('Waiting for keyfile...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    return getEndpointServiceClient(); // Retry
  }

  client = new EndpointServiceClient(clientOptions);
  return client;
}

async function listEndpoints() {
  try {
    const client = await getEndpointServiceClient(); // Get the client

    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = 'northamerica-northeast1';

    // Configure the parent resource
    const parent = `projects/${projectId}/locations/${location}`;
    const request = { parent };

    const [result] = await client.listEndpoints(request);
    for (const endpoint of result) {
      console.log(`\nEndpoint name: ${endpoint.name}`);
      console.log(`Display name: ${endpoint.displayName}`);
      if (endpoint.deployedModels?.[0]) {
        console.log(
          `First deployed model: ${endpoint.deployedModels[0].model}`
        );
      }
    }
  } catch (error) {
    console.error('Error listing endpoints:', error);
  }
}

listEndpoints();

// Get project ID from environment variable
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'northamerica-northeast1'; // Update if needed
const model = 'gemini-1.5-pro-001';

const vertexAI = new VertexAI({ project: projectId, location: location });

// Instantiate the model (consider adjusting safety settings)
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
  systemInstruction: `You are an AI assistant who answers questions about and 
                      provides requested feedback on student-generated posts 
                      on a learning community platform. In responses to the 
                      user, refer to posts, buckets, and tags using their 
                      human-readable names/titles. **Remember**: If asked to
                      simultaneously create a bucket and add posts to it, use 
                      create_bucket_and_add_posts, otherwise you cannot add
                      posts without creating the bucket first.`,
});

function parseVertexAIError(errorString: string): ErrorInfo {
  try {
    const jsonMatch = errorString.match(/{.*}/);

    if (jsonMatch && jsonMatch[0]) {
      const errorObject = JSON.parse(jsonMatch[0]);
      const errorCode = errorObject.error.code;
      const errorMessage = errorObject.error.message;

      return { code: errorCode, message: errorMessage };
    } else {
      console.error('JSON part not found in the error string.');
      return {};
    }
  } catch (e) {
    console.error('Failed to parse the error JSON:', e);
    return {};
  }
}

function isValidJSON(jsonObject: any): boolean {
  try {
    if (!jsonObject.response) {
      return false;
    }

    const allowedKeys = [
      'response',
      'create_bucket',
      'add_post_to_bucket',
      'remove_post_from_bucket',
      'add_to_canvas',
      'remove_from_canvas',
      'create_bucket_and_add_posts',
    ];
    for (const key in jsonObject) {
      if (!allowedKeys.includes(key)) {
        return false;
      }

      // Validate that the optional keys are arrays
      if (key !== 'response' && !Array.isArray(jsonObject[key])) {
        return false;
      }

      // Additional validation for specific keys
      if (key === 'create_bucket_and_add_posts') {
        if (
          !jsonObject[key].every(
            (item: { name: string; postIDs: string[] }) =>
              typeof item.name === 'string' && Array.isArray(item.postIDs)
          )
        ) {
          return false;
        }
      } else if (key === 'create_bucket') {
        if (
          !jsonObject[key].every(
            (item: { name: string }) => typeof item.name === 'string'
          )
        ) {
          return false;
        }
      } else if (
        key === 'add_post_to_bucket' ||
        key === 'remove_post_from_bucket'
      ) {
        if (
          !jsonObject[key].every(
            (item: { postID: string; bucketID: string }) =>
              typeof item === 'object' && item.postID && item.bucketID
          )
        ) {
          return false;
        }
      } else if (key === 'add_to_canvas' || key === 'remove_from_canvas') {
        if (
          !jsonObject[key].every(
            (item: { postID: string }) => typeof item.postID === 'string'
          )
        ) {
          // Corrected validation
          return false;
        }
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

function postsToKeyValuePairs(posts: any[]): string {
  let output = '';
  for (const post of posts) {
    output += `Post with title "${post.title}" (postID: ${post.postID}) by ${post.author}:\n`;
    output += `  - Content: ${post.desc}\n`;
    output += `  - Upvotes: ${post.numUpvotes}\n`;

    // Check if post.hasTags is defined before calling join()
    output += `  - HasTags: ${
      post.hasTags ? post.hasTags.join(', ') : '(none)'
    }\n`;

    // Include bucket names and IDs (check if post.inBuckets is defined)
    if (post.inBuckets && post.inBuckets.length > 0) {
      for (const bucket of post.inBuckets) {
        output += `  - InBucket: ${bucket.name} (bucketID: ${bucket.bucketID})\n`;
      }
    } else {
      output += `  - InBuckets: (none)\n`;
    }

    output += `  - OnCanvas: ${post.onCanvas ? 'Yes' : 'No'}\n`;
    output += '\n';
  }
  return output;
}

function removeJsonMarkdown(text: string): string {
  text = text.trim();
  const startIndex = text.indexOf('```json');
  const endIndex = text.lastIndexOf('```');

  if (startIndex === -1 || endIndex === -1) {
    console.warn('Invalid JSON markdown format:', text);
    return text; // Or handle the error differently
  }

  return text.slice(startIndex + '```json'.length, endIndex);
}

function parseJsonResponse(response: string): any {
  if (!response) {
    return {};
  }

  // Remove the "response" key and its value, including "<END>", "<END>"", or "<END>","
  const responseStartIndex = response.indexOf('"response": "');
  let endLength = '<END>"'.length;
  let responseEndIndex = response.indexOf('<END>",');

  if (responseEndIndex === -1) {
    responseEndIndex = response.indexOf('<END>"');
    if (responseEndIndex !== -1) {
      endLength = '<END>"'.length;
      responseEndIndex += endLength;
    }
  } else {
    endLength = '<END>",'.length;
    responseEndIndex += endLength;
  }

  if (responseStartIndex === -1 || responseEndIndex === -1) {
    console.warn('Invalid response format:', response);
    return {};
  }

  const responseValue = response.substring(
    responseStartIndex + '"response": "'.length,
    responseEndIndex + ('<END>'.length - endLength)
  );

  const textWithoutResponse =
    response.substring(0, responseStartIndex) +
    response.substring(responseEndIndex);

  try {
    const jsonObject = JSON.parse(textWithoutResponse);
    jsonObject.response = responseValue; // Add back with <END> included
    return jsonObject;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
}

function removeEnd(str: string): string {
  const endIndex = str.indexOf('<END>');
  if (endIndex !== -1) {
    return str.substring(0, endIndex);
  }
  return str; // Return original string if <END> is not found
}

async function sendMessage(
  posts: any[],
  currentPrompt: string,
  fullPromptHistory: string,
  socket: socketIO.Socket,
  type: 'teacher_agent' | 'idea_agent'
): Promise<void> {
  try {
    // Send an initial acknowledgment
    socket.emit(SocketEvent.AI_RESPONSE, { status: 'Received', type: type });

    const userId = socket.data.userId;
    const boardId = socket.data.boardId;

    // Save user prompt *only* for teacher_assistant (chat)
    if (type === 'teacher_agent') {
      await dalChatMessage.save({
        userId: userId,
        boardId: boardId,
        role: 'user',
        content: currentPrompt,
      });
    }

    // 1. Fetch Upvote Counts and Create Map
    const upvoteMap = await fetchUpvoteCounts(posts);

    // 2. Fetch Bucket Names and Create Map
    const bucketNameMap = await fetchBucketNames(posts);

    // 3. Add Bucket IDs to Posts
    const postsWithBucketIds = await addBucketIdsToPosts(
      posts,
      bucketNameMap,
      upvoteMap
    );

    // 4. Fetch and Format Buckets
    const bucketsToSend = await fetchAndFormatBuckets(boardId);

    // 5. Create ID mappings
    const { postMap, bucketMap } = createIdMappings(posts, bucketsToSend);

    // Replace IDs in posts and buckets before sending to LLM
    const mappedPosts = replaceIds(postsWithBucketIds, postMap, bucketMap);
    const mappedBuckets = replaceIds(bucketsToSend, postMap, bucketMap);

    // 6. Construct and Send Message to LLM (streaming)
    constructAndSendMessage(mappedPosts, mappedBuckets, fullPromptHistory).then(
      (result) => {
        // Use .then() to handle the Promise
        const stream = result.stream;

        if (stream === undefined) {
          // Handle the case where the stream is undefined
          console.error('Stream is undefined');
          socket.emit(SocketEvent.AI_RESPONSE, {
            status: 'Error',
            errorMessage: 'No response stream received from the language model.\n\nThe AI may have exhausted its input prompt size limit or calls per minute. Please reduce the number of posts and/or try again in a minute.',
            type: type,
          });
          return;
        }

        // Process the response stream (using for await...of)
        let partialResponse = '';
        let finalResponse: AIResponse = { response: '' };

        (async () => {
          // Async IIFE
          for await (const item of stream) {
            partialResponse += item.candidates[0].content.parts[0].text;

            socket.emit(SocketEvent.AI_RESPONSE, {
              status: 'Processing',
              response: partialResponse,
              type: type,
            });
          }

          let isValid;
          const noJsonResponse = removeJsonMarkdown(partialResponse);

          try {
            const parsedResponse = parseJsonResponse(noJsonResponse);

            if (isValidJSON(parsedResponse)) {
              finalResponse = parsedResponse;
              isValid = true;
            } else {
              isValid = false;
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            isValid = false;
          }

          if (isValid) {
            socket.emit(SocketEvent.AI_RESPONSE, {
              status: 'Completed',
              response: finalResponse.response,
              type: type
            });

            // Save AI response
            await dalChatMessage.save({
              userId: userId,
              boardId: boardId,
              role: 'assistant',
              content: removeEnd(finalResponse.response),
            });
          } else {
            const errorMessage = `Completed with invalid formatting: ${partialResponse}`;
            socket.emit(SocketEvent.AI_RESPONSE, {
              status: 'Error',
              errorMessage: errorMessage,
              type: type
            });
          }

          try {
            // Restore original IDs before performing database operations
            const restoredResponse = {
              ...finalResponse,
              remove_from_canvas: restoreIdsFromCanvas(
                finalResponse.remove_from_canvas,
                postMap
              ),
              add_to_canvas: restoreIdsFromCanvas(
                finalResponse.add_to_canvas,
                postMap
              ),
              remove_post_from_bucket: restoreIdsFromBucket(
                finalResponse.remove_post_from_bucket,
                postMap,
                bucketMap
              ),
              add_post_to_bucket: restoreIdsFromBucket(
                finalResponse.add_post_to_bucket,
                postMap,
                bucketMap
              ),
              create_bucket_and_add_posts: restoreIdsCreateBucketAndAddPosts(
                finalResponse.create_bucket_and_add_posts,
                postMap,
                bucketMap
              ),
              // ... restore IDs for other keys as needed
            };

            performDatabaseOperations(restoredResponse, posts, socket);
          } catch (dbError) {
            console.error('Error performing database operations:', dbError);
          }
        })();
      }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);

    const parsedError = parseVertexAIError(error.toString());

    let errorMessage = `An error occurred. Please try again later.`;

    if (parsedError.code === 400) {
      errorMessage =
        "Error: INVALID_ARGUMENT / FAILED_PRECONDITION. Request fails API validation, or you tried to access a model that requires allowlisting or is disallowed by the organization's policy.";
    } else if (parsedError.code === 403) {
      errorMessage =
        "Error: PERMISSION_DENIED. Client doesn't have sufficient permission to call the API.";
    } else if (parsedError.code === 404) {
      errorMessage =
        'Error: NOT_FOUND. No valid object is found from the designated URL. ';
    } else if (parsedError.code === 409) {
      errorMessage =
        'Error: RESOURCE_EXHAUSTED. Depending on the error message, the error could be caused by the following: (1) API quota over the limit; (2) Server overload due to shared server capacity.';
    } else if (parsedError.code === 499) {
      errorMessage = 'Error: CANCELLED. Request is cancelled by the client. ';
    } else if (parsedError.code === 500) {
      errorMessage =
        'Error: UNKNOWN / INTERNAL. Server error due to overload or dependency failure.  ';
    } else if (parsedError.code === 503) {
      errorMessage = 'Error: UNAVAILABLE. Service is temporarily unavailable. ';
    } else if (parsedError.code === 504) {
      errorMessage =
        "Error: DEADLINE_EXCEEDED. The client sets a deadline shorter than the server's default deadline (10 minutes), and the request didn't finish within the client-provided deadline.";
    }

    socket.emit(SocketEvent.AI_RESPONSE, {
      status: 'Error',
      errorMessage: errorMessage,
      type: type
    });
  }
}

// Helper functions for ID mapping and replacement

function createIdMappings(posts: any[], buckets: any[]) {
  const postMap = new Map<string, string>();
  const bucketMap = new Map<string, string>();

  let postCounter = 1;
  for (const post of posts) {
    postMap.set(post.postID, `post_${postCounter}`);
    postCounter++;
  }

  let bucketCounter = 1;
  for (const bucket of buckets) {
    bucketMap.set(bucket.bucketID, `bucket_${bucketCounter}`);
    bucketCounter++;
  }

  return { postMap, bucketMap };
}

function replaceIds(
  data: any[],
  postMap: Map<string, string>,
  bucketMap: Map<string, string>
): any[] {
  return data.map((item) => {
    const updatedItem = { ...item }; // Create a copy of the item

    // Replace postID
    if (item.postID) {
      updatedItem.postID = postMap.get(item.postID) || item.postID;
    }

    // Replace bucketID
    if (item.bucketID) {
      updatedItem.bucketID = bucketMap.get(item.bucketID) || item.bucketID;
    }

    // Replace bucketIDs in inBuckets array
    if (item.inBuckets) {
      updatedItem.inBuckets = item.inBuckets.map(
        (bucket: { bucketID: string }) => ({
          ...bucket,
          bucketID: bucketMap.get(bucket.bucketID) || bucket.bucketID,
        })
      );
    }

    return updatedItem;
  });
}

function restoreIdsFromCanvas(
  data: { postID: string }[] | undefined,
  postMap: Map<string, string>
): { postID: string }[] {
  const reversedPostMap = new Map(
    [...postMap.entries()].map(([key, value]) => [value, key])
  );

  if (!data) {
    return []; // Return an empty array if data is undefined
  }

  return data.map((item) => ({
    ...item,
    postID: reversedPostMap.get(item.postID) || item.postID,
  }));
}

function restoreIdsFromBucket(
  data: { postID: string; bucketID: string }[] | undefined,
  postMap: Map<string, string>,
  bucketMap: Map<string, string>
): { postID: string; bucketID: string }[] {
  const reversedPostMap = new Map(
    [...postMap.entries()].map(([key, value]) => [value, key])
  );
  const reversedBucketMap = new Map(
    [...bucketMap.entries()].map(([key, value]) => [value, key])
  );

  if (!data) {
    return []; // Return an empty array if data is undefined
  }

  return data.map((item) => ({
    ...item,
    postID: reversedPostMap.get(item.postID) || item.postID,
    bucketID: reversedBucketMap.get(item.bucketID) || item.bucketID,
  }));
}

function restoreIdsCreateBucketAndAddPosts(
  data: { name: string; postIDs: string[] }[] | undefined,
  postMap: Map<string, string>,
  bucketMap: Map<string, string>
): { name: string; postIDs: string[] }[] {
  const reversedPostMap = new Map(
    [...postMap.entries()].map(([key, value]) => [value, key])
  );

  if (!data) {
    return []; // Return an empty array if data is undefined
  }

  return data.map((item) => ({
    ...item,
    postIDs: item.postIDs.map(
      (postID: string) => reversedPostMap.get(postID) || postID
    ),
  }));
}

async function performDatabaseOperations(
  response: any,
  posts: any[],
  socket: socketIO.Socket
) {
  const validPostIds = new Set(posts.map((post) => post.postID));

  if (response.create_bucket) {
    for (const bucket of response.create_bucket) {
      const bucketName = bucket.name;

      const newBucket: BucketModel = {
        bucketID: generateUniqueID(),
        boardID: socket.data.boardId,
        name: bucketName,
        posts: [],
      };

      const savedBucket = await dalBucket.create(newBucket);
      console.log('Added bucket:', savedBucket);

      // Emit bucket create event
      socket.emit(SocketEvent.BUCKET_CREATE, savedBucket);
    }
  }

  if (response.create_bucket_and_add_posts) {
    for (const action of response.create_bucket_and_add_posts) {
      const { name, postIDs } = action;

      const newBucket: BucketModel = {
        bucketID: generateUniqueID(),
        boardID: socket.data.boardId,
        name: name,
        posts: [],
      };
      const savedBucket = await dalBucket.create(newBucket);

      const validPostIDsToAdd = postIDs.filter((id: string) =>
        validPostIds.has(id)
      );
      if (validPostIDsToAdd.length > 0) {
        await dalBucket.addPost(savedBucket.bucketID, validPostIDsToAdd);

        // Emit bucket create event
        socket.emit(SocketEvent.BUCKET_CREATE, savedBucket);

        // Emit post update events for each post added to the bucket
        for (const postID of validPostIDsToAdd) {
          const updatedPost = await dalPost.getById(postID);
          if (updatedPost) {
            socket.emit(SocketEvent.POST_UPDATE, updatedPost);
          }
        }
      } else {
        console.log(`Created bucket ${name} (no valid posts to add)`);
      }
    }
  }

  if (response.add_post_to_bucket) {
    const actionsByBucket: Record<string, string[]> = {};

    for (const action of response.add_post_to_bucket) {
      const { bucketID, postID, name } = action;

      if (validPostIds.has(postID)) {
        if (bucketID) {
          actionsByBucket[bucketID] = (actionsByBucket[bucketID] || []).concat(
            postID
          );
        } else if (name) {
          const bucket = await dalBucket.getByName(name, socket.data.boardId);
          if (bucket) {
            actionsByBucket[bucket.bucketID] = (
              actionsByBucket[bucket.bucketID] || []
            ).concat(postID);
          } else {
            console.log(`Bucket with name "${name}" not found`);
          }
        } else {
          console.log(`No bucketID or name provided for postID ${postID}`);
        }
      } else {
        console.log(`Skipping invalid postID ${postID}`);
      }
    }

    for (const bucketID in actionsByBucket) {
      const postIDs = actionsByBucket[bucketID];
      const updatedBucket = await dalBucket.addPost(bucketID, postIDs);
      console.log(
        `Added posts ${postIDs.join(', ')} to bucket ${bucketID}:`,
        updatedBucket
      );

      // Emit post update events for each post added to the bucket
      for (const postID of postIDs) {
        const updatedPost = await dalPost.getById(postID);
        if (updatedPost) {
          socket.emit(SocketEvent.POST_UPDATE, updatedPost);
        }
      }
    }
  }

  if (response.remove_post_from_bucket) {
    const actionsByBucket: Record<string, string[]> = {};

    for (const action of response.remove_post_from_bucket) {
      const { bucketID, postID, name } = action;

      if (validPostIds.has(postID)) {
        if (bucketID) {
          actionsByBucket[bucketID] = (actionsByBucket[bucketID] || []).concat(
            postID
          );
        } else if (name) {
          const bucket = await dalBucket.getByName(name, socket.data.boardId);
          if (bucket) {
            actionsByBucket[bucket.bucketID] = (
              actionsByBucket[bucket.bucketID] || []
            ).concat(postID);
          } else {
            console.log(`Bucket with name "${name}" not found`);
          }
        } else {
          console.log(`No bucketID or name provided for postID ${postID}`);
        }
      } else {
        console.log(`Skipping invalid postID ${postID}`);
      }
    }

    for (const bucketID in actionsByBucket) {
      const postIDs = actionsByBucket[bucketID];
      const updatedBucket = await dalBucket.removePost(bucketID, postIDs);
      console.log(
        `Removed posts ${postIDs.join(', ')} from bucket ${bucketID}:`,
        updatedBucket
      );

      // Emit post update events for each post removed from the bucket
      for (const postID of postIDs) {
        const updatedPost = await dalPost.getById(postID);
        if (updatedPost) {
          socket.emit(SocketEvent.POST_UPDATE, updatedPost);
        }
      }
    }
  }

  if (response.add_to_canvas) {
    for (const post of response.add_to_canvas) {
      const postID = post.postID;
      if (validPostIds.has(postID)) {
        const updatedPost = await dalPost.update(postID, {
          type: PostType.BOARD,
        });
        console.log('Added post to canvas:', updatedPost);

        // Emit post update event
        socket.emit(SocketEvent.POST_CREATE, updatedPost);
      } else {
        console.log(`Skipping invalid postID ${postID} for adding to canvas`);
      }
    }
  }

  if (response.remove_from_canvas) {
    for (const post of response.remove_from_canvas) {
      const postID = post.postID;
      if (validPostIds.has(postID)) {
        const updatedPost = await dalPost.update(postID, {
          type: PostType.BUCKET,
        });
        console.log('Removed post from canvas:', updatedPost);

        // Emit post update event
        socket.emit(SocketEvent.POST_DELETE, postID);
      } else {
        console.log(
          `Skipping invalid postID ${postID} for removing from canvas`
        );
      }
    }
  }
}

async function constructAndSendMessage(
  postsWithBucketIds: any[],
  bucketData: any[],
  prompt: string
): Promise<any> {
  const postData = postsToKeyValuePairs(postsWithBucketIds);

  const promptTemplate =
    `
    Please provide your response in the following JSON format, including the 
    "response" key and optionally any of the following keys: "create_bucket", 
    "create_bucket_and_add_posts", "add_post_to_bucket", "remove_post_from_bucket", 
    "remove_from_canvas", "add_to_canvas".

    The response value should end with <END>. Each of the optional keys should be a 
    list of objects, where each object represents an action to be performed.

    {
      "response": "Your response to the user here<END>",
      "create_bucket": [{"name": "bucket_name"}], 
      "add_post_to_bucket": [
        {
          "postID": "post_id_1",
          "bucketID": "bucket_id_1"
        },
        {
          "postID": "post_id_2",
          "bucketID": "bucket_id_2"
        }
      ],
      "remove_post_from_bucket": [
        {
          "postID": "post_id_3",
          "bucketID": "bucket_id_3"
        }
      ],
      "add_to_canvas": [{"postID": "post_id_4"}, {"postID": "post_id_5"}],
      "remove_from_canvas": [{"postID": "post_id_6"}],
      "create_bucket_and_add_posts": [
        {
          "name": "new_bucket_name",
          "postIDs": ["post_id_7", "post_id_8"] 
        }
      ]
    }

    **Remember:** As this is a json response, use single quotes or escape characters when quoting text and wrap the entire response in json markdown.

    Here are the posts from the project:` +
    postData + 
    `\nHere are the buckets:\n` +
    JSON.stringify(bucketData, null, 2) +
    `\nUser prompt:\n\n${prompt}`;

  try {
    const result = await generativeModel.generateContentStream(promptTemplate);
    return result;
  } catch (error) {
    console.error('Error in generateContentStream:', error);
    
    // --- Error Handling ---
    let errorMessage = 'An unexpected error occurred.';
    let errorCode = 500; // Default to Internal Server Error

    let errorString = '';
    if (error instanceof Error) {
        errorString = error.message;
    } else if (typeof error === 'string') {
        errorString = error;
    } else {
        errorString = String(error); // Fallback for other types
    }


    // Attempt to parse the Vertex AI error
    const parsedError = parseVertexAIError(errorString);
    if (parsedError.code) {
      errorCode = parsedError.code;
    }
    if (parsedError.message) {
      errorMessage = parsedError.message;
    }
    // Specific error message refinements based on the error code
     if (errorCode === 400) {
      errorMessage = "The request was invalid. This could be due to a malformed request, or attempting to access a model that is restricted or unavailable to you.";
    } else if (errorCode === 429) {
      errorMessage = "Resource exhausted or quota limit reached. Please try again later.";
    } else if (errorCode === 500) {
            errorMessage =
        'Error: UNKNOWN / INTERNAL. Server error due to overload or dependency failure.  ';
    } else if(errorCode === 413 || errorMessage.toLowerCase().includes("token")){
        errorMessage = "The request was too large. Reduce the context provided to the AI agent.";
    }


    // Construct an error response object in the expected format.
    const errorResponse = {
      status: 'Error',
      errorMessage: errorMessage,
      type: 'error', // Will be overwritten in sendMessage
      code: errorCode,
      originalError: errorString,
    };

    // Return the error response, *instead* of throwing.
    return errorResponse;
  }
}

async function fetchAndFormatBuckets(boardId: string): Promise<any[]> {
  // Fetch ALL buckets for the board
  const buckets = await dalBucket.getByBoardId(boardId); // Assuming all posts belong to the same board

  // Create a list of buckets with their bucketIDs
  return buckets.map((bucket) => ({
    name: bucket.name,
    bucketID: bucket.bucketID,
  }));
}

async function addBucketIdsToPosts(
  posts: any[],
  bucketNameMap: Map<string, string[]>,
  upvoteMap: Map<string, number>
): Promise<any[]> {
  return await Promise.all(
    posts.map(async (post) => {
      const inBuckets = await Promise.all(
        (bucketNameMap.get(post.postID) || []).map(
          async (bucketName: string) => {
            // Find the bucket using getByPostId
            const buckets = await dalBucket.getByPostId(post.postID);
            const bucket = buckets.find((b) => b.name === bucketName);

            return {
              name: bucketName,
              bucketID: bucket ? bucket.bucketID : null,
            };
          }
        )
      );

      // Include upvotes, tags, and onCanvas in the post object
      return {
        ...post,
        numUpvotes: upvoteMap.get(post.postID) || 0,
        hasTags: post.tags.map((tag: { name: string }) => tag.name),
        inBuckets: inBuckets,
        onCanvas: post.type === 'BOARD',
      };
    })
  );
}

async function fetchBucketNames(posts: any[]): Promise<Map<string, string[]>> {
  // Fetch bucket names for each post
  const bucketNames = await Promise.all(
    posts.map(async (post) => {
      const buckets = await dalBucket.getByPostId(post.postID);
      return {
        postId: post.postID,
        bucketNames: buckets.map((bucket) => bucket.name),
      };
    })
  );

  // Create a map of post IDs to bucket names
  return new Map(bucketNames.map((entry) => [entry.postId, entry.bucketNames]));
}

async function fetchUpvoteCounts(posts: any[]): Promise<Map<string, number>> {
  // Fetch upvote counts for each post
  const upvoteCounts = await Promise.all(
    posts.map(async (post) => ({
      postId: post.postID,
      upvotes: await dalVote.getAmountByPost(post.postID),
    }))
  );

  // Create a map of post IDs to upvote counts
  return new Map(upvoteCounts.map((count) => [count.postId, count.upvotes]));
}

export { sendMessage };
