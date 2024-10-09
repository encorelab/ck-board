require('dotenv').config();

const { VertexAI } = require('@google-cloud/vertexai');

// Get project ID from environment variable
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'northamerica-northeast1'; // Update if needed
const model = 'gemini-1.5-flash-002';

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
});

const chat = generativeModel.startChat({});

async function sendMessage(posts: any[], prompt: string): Promise<string> {
  try {
    // Create a list of posts with only title and description
    const postsToSend = posts.map(post => ({ 
      title: post.title, 
      desc: post.desc 
    }));

    // Format the posts and prompt for the model (using postsToSend)
    const message = `Here are the posts from the project:\n\n${JSON.stringify(
      postsToSend, // Use the simplified posts here
      null,
      2
    )}\n\nUser prompt: ${prompt}`;

    // Change 1: Send only the prompt as the message
    const streamResult = await chat.sendMessageStream(message);

    const response = removeFirstAndLastQuotes(JSON.stringify((await streamResult.response).candidates[0].content.parts[0].text));
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    return 'An error occurred. Please try again later.';
  }
}

function removeFirstAndLastQuotes(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1); 
  }
  return str; 
}

export { sendMessage };