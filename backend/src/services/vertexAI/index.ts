import dalVote from '../../repository/dalVote';
import dalBucket from '../../repository/dalBucket'
import { BucketModel } from '../../models/Bucket';
import { generateUniqueID } from '../../utils/Utils';
import dalPost from '../../repository/dalPost';
import { PostType } from '../../models/Post'
import * as socketIO from 'socket.io';
import { SocketEvent } from '../../constants';
import * as dotenv from 'dotenv'; 
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { EndpointServiceClient } from '@google-cloud/aiplatform';


global.Headers = Headers;

dotenv.config();

interface AIResponse {
  response: string; 
}

// Specifies the location of the API endpoint
const clientOptions = {
  apiEndpoint: 'northamerica-northeast1-aiplatform.googleapis.com', 
};
const client = new EndpointServiceClient(clientOptions);

async function listEndpoints() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT; 
  const location = 'northamerica-northeast1'; 

  // Configure the parent resource
  const parent = `projects/${projectId}/locations/${location}`;
  const request = { parent };

  try {
    const [result] = await client.listEndpoints(request);
    for (const endpoint of result) {
      console.log(`\nEndpoint name: ${endpoint.name}`);
      console.log(`Display name: ${endpoint.displayName}`);
      if (endpoint.deployedModels?.[0]) {
        console.log(`First deployed model: ${endpoint.deployedModels[0].model}`);
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

const vertexAI = new VertexAI({ project:projectId, location:location });

// Instantiate the model (consider adjusting safety settings)
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
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
    }
  ],
  systemInstruction: `You are an AI assistant who answers questions about and provides requested feedback on student-generated posts on a learning community platform. In responses to the user, refer to posts, buckets, and tags using their human-readable names/titles. If asked for a quantity, double check your count because you're sometimes incorrect.`,
});

const chat = generativeModel.startChat({});

function parseVertexAIError(errorString: string): { code?: number; message?: string } {
  try {
    // Use a regular expression to extract the JSON part
    const jsonMatch = errorString.match(/{.*}/);

    if (jsonMatch && jsonMatch[0]) {
      // Parse the JSON string
      const errorObject = JSON.parse(jsonMatch[0]);

      // Access code and message
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

function isValidJSON(str: string): boolean {
  try {
    const jsonObject = JSON.parse(str);

    if (!jsonObject.response) {
      return false;
    }

    const allowedKeys = ['response', 'add_bucket', 'add_post_to_bucket', 'remove_post_from_bucket', 'add_to_canvas', 'remove_from_canvas'];
    for (const key in jsonObject) {
      if (!allowedKeys.includes(key)) {
        return false;
      }

      // Validate that the optional keys are arrays
      if (key !== 'response' && !Array.isArray(jsonObject[key])) { 
        return false;
      }

      // Additional validation for specific keys (with type annotations)
      if (key === 'add_bucket') {
        if (!jsonObject[key].every((item: { name: string }) => typeof item.name === 'string')) { 
          return false;
        }
      } else if (key === 'add_post_to_bucket' || key === 'remove_post_from_bucket') {
        if (!jsonObject[key].every((item: { postID: string; bucketID: string }) => 
              typeof item === 'object' && item.postID && item.bucketID)
        ) {
          return false;
        }
      } else if (key === 'add_to_canvas' || key === 'remove_from_canvas') { 
        if (!jsonObject[key].every((item: { postID: string }) => typeof item.postID === 'string')) { // Corrected validation
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
  let output = "";
  for (const post of posts) {
    output += `Post with title "${post.title}" (postID: ${post.postID}):\n`;
    output += `  - Content: ${post.desc}\n`;
    output += `  - Upvotes: ${post.numUpvotes}\n`;
    
    // Check if post.hasTags is defined before calling join()
    output += `  - HasTags: ${post.hasTags ? post.hasTags.join(', ') : '(none)'}\n`; 

    // Include bucket names and IDs (check if post.inBuckets is defined)
    if (post.inBuckets && post.inBuckets.length > 0) { 
      for (const bucket of post.inBuckets) {
        output += `  - InBucket: ${bucket.name} (bucketID: ${bucket.bucketID})\n`;
      }
    } else {
      output += `  - InBuckets: (none)\n`;
    }

    output += `  - OnCanvas: ${post.onCanvas ? 'Yes' : 'No'}\n`;
    output += "\n";
  }
  return output;
}

function removeJsonMarkdown(text: string): string {
  const pattern = /```json\s*([\s\S]*?)\s*```/g;
  return text.replace(pattern, '$1');
}

async function sendMessage(posts: any[], prompt: string, socket: socketIO.Socket): Promise<void> { 
  try {
    // Send an initial acknowledgment
    socket.emit(SocketEvent.AI_RESPONSE, { status: "Received" }); 

    // 1. Fetch Upvote Counts and Create Map
    const upvoteMap = await fetchUpvoteCounts(posts);

    // 2. Fetch Bucket Names and Create Map
    const bucketNameMap = await fetchBucketNames(posts);

    // 3. Add Bucket IDs to Posts
    const postsWithBucketIds = await addBucketIdsToPosts(posts, bucketNameMap, upvoteMap);

    // 4. Fetch and Format Buckets
    const bucketsToSend = await fetchAndFormatBuckets(posts);

    // 5. Construct and Send Message to LLM (streaming)
    constructAndSendMessage(postsWithBucketIds, bucketsToSend, prompt) 
      .then(result => { // Use .then() to handle the Promise
        const stream = result.stream; 

        if (stream === undefined) {
          // Handle the case where the stream is undefined
          console.error('Stream is undefined');
          socket.emit(SocketEvent.AI_RESPONSE, { status: "Error", errorMessage: "No response stream received from the language model" });
          return; 
        }

        // Process the response stream (using for await...of)
        let partialResponse = '';
        let finalResponse: AIResponse = { response: '' }; 

        (async () => { // Async IIFE
          for await (const item of stream) {
            partialResponse += item.candidates[0].content.parts[0].text; 
            // console.log("Partial response:", partialResponse);
      
            socket.emit(SocketEvent.AI_RESPONSE, { status: "Processing", response: partialResponse });
          }
      
          let isValid;
          try {
            const cleanedResponse = removeJsonMarkdown(partialResponse);
            const parsedResponse = JSON.parse(cleanedResponse);
      
            if (isValidJSON(cleanedResponse)) {
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
            socket.emit(SocketEvent.AI_RESPONSE, { status: "Completed", response: finalResponse.response });
          } else {
            let errorMessage = "Invalid response formatting. Please try again.\n\n" + finalResponse.response;
            socket.emit(SocketEvent.AI_RESPONSE, { status: "Error", errorMessage: errorMessage });
          }
      
          try {
            performDatabaseOperations(finalResponse, posts); 
          } catch (dbError) {
            console.error("Error performing database operations:", dbError);
          }
        })();
      })
  } catch (error: any) {
    console.error('Error sending message:', error);

    const parsedError = parseVertexAIError(error.toString());

    let errorMessage = `An error occurred. Please try again later.`;

    if (parsedError.code === 400) {
      errorMessage = 'Error: INVALID_ARGUMENT / FAILED_PRECONDITION. Request fails API validation, or you tried to access a model that requires allowlisting or is disallowed by the organization\'s policy.';
    } else if (parsedError.code === 403) {
      errorMessage = 'Error: PERMISSION_DENIED. Client doesn\'t have sufficient permission to call the API.';
    } else if (parsedError.code === 404) {
      errorMessage = 'Error: NOT_FOUND. No valid object is found from the designated URL. ';
    } else if (parsedError.code === 409) {
      errorMessage = 'Error: RESOURCE_EXHAUSTED. Depending on the error message, the error could be caused by the following: (1) API quota over the limit; (2) Server overload due to shared server capacity.';
    } else if (parsedError.code === 499) {
      errorMessage = 'Error: CANCELLED. Request is cancelled by the client. ';
    } else if (parsedError.code === 500) {
      errorMessage = 'Error: UNKNOWN / INTERNAL. Server error due to overload or dependency failure.  ';
    } else if (parsedError.code === 503) {
      errorMessage = 'Error: UNAVAILABLE. Service is temporarily unavailable. ';
    } else if (parsedError.code === 504) {
      errorMessage = 'Error: DEADLINE_EXCEEDED. The client sets a deadline shorter than the server\'s default deadline (10 minutes), and the request didn\'t finish within the client-provided deadline.';
    }

    socket.emit(SocketEvent.AI_RESPONSE, { status: "Error", errorMessage: errorMessage });
  } 
}

async function performDatabaseOperations(response: any, posts: any[]) {
  if (response.add_bucket) {
    for (const bucket of response.add_bucket) {
      const bucketName = bucket.name;

      const newBucket: BucketModel = {
        bucketID: generateUniqueID(),
        boardID: posts[0].boardID, // Assuming all posts belong to the same board
        name: bucketName,
        posts: []
      };

      const savedBucket = await dalBucket.create(newBucket);
      console.log('Added bucket:', savedBucket);
    }
  }

  if (response.add_post_to_bucket) {
    // Group actions by bucketID
    const actionsByBucket = response.add_post_to_bucket.reduce((acc: Record<string, string[]>, action: { postID: string; bucketID: string }) => {
      const { bucketID, postID } = action;
      acc[bucketID] = (acc[bucketID] || []).concat(postID);
      return acc;
    }, {} as Record<string, string[]>);

    for (const bucketID in actionsByBucket) {
      const postIDs = actionsByBucket[bucketID];
      const updatedBucket = await dalBucket.addPost(bucketID, postIDs);
      console.log(`Added posts ${postIDs.join(', ')} to bucket ${bucketID}:`, updatedBucket);
    }
  }

  if (response.remove_post_from_bucket) {
    // Group actions by bucketID
    const actionsByBucket = response.remove_post_from_bucket.reduce((acc: Record<string, string[]>, action: { postID: string; bucketID: string }) => {
      const { bucketID, postID } = action;
      acc[bucketID] = (acc[bucketID] || []).concat(postID);
      return acc;
    }, {} as Record<string, string[]>);

    for (const bucketID in actionsByBucket) {
      const postIDs = actionsByBucket[bucketID];
      const updatedBucket = await dalBucket.removePost(bucketID, postIDs);
      console.log(`Removed posts ${postIDs.join(', ')} from bucket ${bucketID}:`, updatedBucket);
    }
  }

  if (response.add_to_canvas) {
    for (const post of response.add_to_canvas) {
      const postID = post.postID;

      const updatedPost = await dalPost.update(postID, { type: PostType.BOARD });
      console.log('Added post to canvas:', updatedPost);
    }
  }

  if (response.remove_from_canvas) {
    for (const post of response.remove_from_canvas) {
      const postID = post.postID;

      const updatedPost = await dalPost.update(postID, { type: PostType.BUCKET });
      console.log('Removed post from canvas:', updatedPost);
    }
  }
}

async function constructAndSendMessage(postsWithBucketIds: any[], bucketsToSend: any[], prompt: string): Promise<any> {
  const postsAsKeyValuePairs = postsToKeyValuePairs(postsWithBucketIds);

  const message = `
Please provide your response in the following JSON format, including the "response" key and optionally any of the following keys: "add_bucket", "add_post_to_bucket", "remove_post_from_bucket", "remove_from_canvas", "add_to_canvas".

The response value should end with <END>. Each of the optional keys should be a list of objects, where each object represents an action to be performed.

{
  "response": "Your response here<END>",
  "add_bucket": [{"name": "bucket_name"}], 
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
  "remove_from_canvas": [{"postID": "post_id_6"}] 
}

Here are the posts from the project:

${postsAsKeyValuePairs}

Here are the buckets:

${JSON.stringify(bucketsToSend, null, 2)}

User prompt: ${prompt}    
  `;

  // console.log("User prompt: " + message);

  try {
    const result = await chat.sendMessageStream(message); // Get the StreamGenerateContentResult

    return result;
  } catch (error) {
    console.error('Error in sendMessageStream:', error);
    throw error;
  }
}

async function fetchAndFormatBuckets(posts: any[]): Promise<any[]> {
  // Fetch ALL buckets for the board
  const buckets = await dalBucket.getByBoardId(posts[0].boardID); // Assuming all posts belong to the same board

  // Create a list of buckets with their bucketIDs
  return buckets.map(bucket => ({
    name: bucket.name,
    bucketID: bucket.bucketID
  }));
}

async function addBucketIdsToPosts(posts: any[], bucketNameMap: Map<string, string[]>, upvoteMap: Map<string, number>): Promise<any[]> {
  return await Promise.all(
    posts.map(async (post) => {
      const inBuckets = await Promise.all(
        (bucketNameMap.get(post.postID) || []).map(async (bucketName: string) => {
          // Find the bucket using getByPostId
          const buckets = await dalBucket.getByPostId(post.postID); 
          const bucket = buckets.find(b => b.name === bucketName);
      
          return {
            name: bucketName,
            bucketID: bucket ? bucket.bucketID : null,
          };
        })
      );

      // Include upvotes, tags, and onCanvas in the post object
      return {
        ...post,
        numUpvotes: upvoteMap.get(post.postID) || 0,
        hasTags: post.tags.map((tag: { name: string }) => tag.name),
        inBuckets: inBuckets,
        onCanvas: post.type === 'BOARD'
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
        bucketNames: buckets.map(bucket => bucket.name)
      };
    })
  );

  // Create a map of post IDs to bucket names
  return new Map(bucketNames.map(entry => [entry.postId, entry.bucketNames]));
}

async function fetchUpvoteCounts(posts: any[]): Promise<Map<string, number>> {
  // Fetch upvote counts for each post
  const upvoteCounts = await Promise.all(
    posts.map(async (post) => ({
      postId: post.postID,
      upvotes: await dalVote.getAmountByPost(post.postID)
    }))
  );

  // Create a map of post IDs to upvote counts
  return new Map(upvoteCounts.map(count => [count.postId, count.upvotes]));
}

function removeFirstAndLastQuotes(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1); 
  }
  return str; 
}

export { sendMessage };