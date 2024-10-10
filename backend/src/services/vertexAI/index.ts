import dalVote from '../../repository/dalVote';
import dalBucket from '../../repository/dalBucket'

require('dotenv').config();

const { VertexAI } = require('@google-cloud/vertexai');

// Get project ID from environment variable
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'northamerica-northeast1'; // Update if needed
const model = 'gemini-1.5-pro-002';

const vertexAI = new VertexAI({ project:projectId, location:location });

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
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    },
  ],
  systemInstruction: {
    parts: [{"text": `You are an AI assistant who answers questions about student-generated posts on a learning community platform`}]
  },
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

function postsToKeyValuePairs(posts: any[]): string {
  let output = "";
  for (const post of posts) {
    output += `Post with title "${post.title}":\n`;
    output += `  - Content: ${post.content}\n`;
    output += `  - Upvotes: ${post.numUpvotes}\n`;
    output += `  - HasTags: ${post.hasTags.join(', ') || '(none)'}\n`;
    output += `  - InBuckets: ${post.inBuckets.join(', ') || '(none)'}\n`;
    output += `  - OnCanvas: ${post.onCanvas ? 'Yes' : 'No'}\n`;
    output += "\n"; 
  }
  return output;
}

async function sendMessage(posts: any[], prompt: string): Promise<string> {
  try {
    // Fetch upvote counts for each post
    const upvoteCounts = await Promise.all(
      posts.map(async (post) => ({
        postId: post.postID,
        upvotes: await dalVote.getAmountByPost(post.postID)
      }))
    );

    // Create a map of post IDs to upvote counts
    const upvoteMap = new Map(upvoteCounts.map(count => [count.postId, count.upvotes]));

    // Fetch bucket names for each post
    const bucketNames = await Promise.all(
      posts.map(async (post) => {
        const buckets = await dalBucket.getByPostId(post.postID);
        return {
          postId: post.postID,
          bucketNames: buckets.map(bucket => bucket.name) // Extract bucket names
        };
      })
    );

    // Create a map of post IDs to bucket names
    const bucketNameMap = new Map(bucketNames.map(entry => [entry.postId, entry.bucketNames]));

    // Add bucket names to the posts
    const postsToSend = posts.map(post => ({
      title: post.title,
      content: post.desc,
      numUpvotes: upvoteMap.get(post.postID) || 0,
      hasTags: post.tags.map((tag: { name: string }) => tag.name),
      inBuckets: bucketNameMap.get(post.postID) || [],
      onCanvas: post.type == 'BOARD' as string
    }));

    const postsAsKeyValuePairs = postsToKeyValuePairs(postsToSend)

    // Format the posts and prompt for the model (using postsToSend)
    const message = `Here are the posts from the project:\n\n${postsAsKeyValuePairs}\n\nUser prompt: ${prompt}`;

    // Change 1: Send only the prompt as the message
    const streamResult = await chat.sendMessageStream(message);

    const response = removeFirstAndLastQuotes(JSON.stringify((await streamResult.response).candidates[0].content.parts[0].text));
    return response;
  } catch (error: any) {
    console.error('Error sending message:', error);

    const parsedError = parseVertexAIError(error.toString());
  
    let errorMessage = `An error occurred. Please try again later.`;
  
    // Check for specific error codes and status messages
    if (parsedError.code === 400) {
      errorMessage = 'Error: INVALID_ARGUMENT / FAILED_PRECONDITION. Request fails API validation, or you tried to access a model that requires allowlisting or is disallowed by the organization\'s policy.';
    } else if (parsedError.code === 403) {
      errorMessage = 'Error: PERMISSION_DENIED. Client doesn\'t have sufficient permission to call the API.';
    } else if (parsedError.code === 404) {
      errorMessage = 'Error: NOT_FOUND. No valid object is found from the designated URL.	';
    } else if (parsedError.code === 409) {
      errorMessage = 'Error: RESOURCE_EXHAUSTED. Depending on the error message, the error could be caused by the following: (1) API quota over the limit; (2) Server overload due to shared server capacity.';
    } else if (parsedError.code === 499) {
      errorMessage = 'Error: CANCELLED. Request is cancelled by the client.	';
    } else if (parsedError.code === 500) {
      errorMessage = 'Error: UNKNOWN / INTERNAL. Server error due to overload or dependency failure.	';
    } else if (parsedError.code === 503) {
      errorMessage = 'Error: UNAVAILABLE. Service is temporarily unavailable.	';
    } else if (parsedError.code === 504) {
      errorMessage = 'Error: DEADLINE_EXCEEDED. The client sets a deadline shorter than the server\'s default deadline (10 minutes), and the request didn\'t finish within the client-provided deadline.';
    }
  
    return errorMessage;
  }
}

function removeFirstAndLastQuotes(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1); 
  }
  return str; 
}

export { sendMessage };