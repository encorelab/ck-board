## Description

This Common Knowledge (CK) Board is the latest rebuild of the ENCORE Lab's collaborative canvas for guiding collective inquiry and active learning activities.

## Setup

### 1. Install Node.js, Angular, and Redis

- Node: https://nodejs.org/
  - Use the v18
- Angular: `npm install -g @angular/cli `
- Redis: https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/

### 2. Clone the repository

```shell
$ git clone https://github.com/encorelab/ck-board.git
```

### 3. Install required dependencies

Install Frontend dependencies:

```shell
$ cd frontend
$ npm install
```

Install Backend dependencies:

```shell
$ cd backend
$ npm install
```

### 4. Add environment variables

Create a `.env` file inside the `/backend` directory (`touch .env` in your terminal or manually create file using your IDE)

Add the following content into the `.env` file and replace with your own credentials:

```
DB_USER=[MongoDB Username]
DB_PASSWORD=[MongoDB Password]
DB_URL=[MongoDB URL]
DB_NAME=[MongoDB Name]
JWT_SECRET=[JWT Secret Token]
PORT=8001
STATIC_FILES_PATH=[for dev, use "./../../frontend/dist/ck-board"; for production, use "/site/wwwroot/frontend/dist/ck-board"]
CKBOARD_SERVER_ADDRESS=[For dev, use "http://localhost:4201"; for production, use server URL, e.g., "https://ck-board.oise.utoronto.ca"]
GOOGLE_APPLICATION_CREDENTIALS="./secrets/keyfile.json"
GOOGLE_CLOUD_PROJECT=[Google Cloud Project ID]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_EMAIL=[gmail password]
SMTP_PASSWORD=[gmail 'app' password (generated at https://myaccount.google.com/apppasswords)]
```

**1. `GOOGLE_APPLICATION_CREDENTIALS`**

- **Purpose:** This variable specifies the path to your Google Cloud service account key file. This key file allows the application to authenticate with Google Cloud and access Vertex AI services.
- **How to obtain:**
    1. **Create a Google Cloud Project:** If you don't have one already, create a new project in the Google Cloud Console.  Remember the **Project ID** (e.g., `ai-data-extractor`).
    2. **Create a Service Account:** In your Google Cloud project, go to the **IAM & Admin** > **Service Accounts** page and create a new service account.
    3. **Create a Key:**  For the service account, create a new key of type **JSON**. This will download a JSON file containing your key file.
    4. **Store securely:** Store this JSON file in a secure location within your project's **backend** directory (e.g., `./secrets/keyfile.json`).
- **Example:** `GOOGLE_APPLICATION_CREDENTIALS="./secrets/keyfile.json"`

**2. `GOOGLE_CLOUD_PROJECT`**

- **Purpose:** This variable indicates the ID of your Google Cloud project. 
- **How to obtain:** Use the **Project ID** you noted when creating your Google Cloud project.
- **Example:** `GOOGLE_CLOUD_PROJECT=ck-ai-assistant`

**SCORE SSO (Optional)**

If also running [SCORE](https://github.com/WISE-Community/WISE-Docker-Dev) for Single Sign-On (SSO), add the following additional content into the `.env` file and replace with your own credentials:

```
SCORE_SSO_ENDPOINT=/sso/ckboard
SCORE_SSO_SECRET= [any value that matches ck_board_sso_secret on SCORE]
SCORE_LOGOUT_ENDPOINT=/api/logout 
```

For the SCORE development environment, add the following values to application-dockerdev.properties 

```
ck_board_url=http://localhost:4201
ck_board_sso_secret_key=[any value that matches SCORE_SSO_SECRET on CK Board]
```

### 5. Run Application

Start redis, server first, then start client app once the server has successfully started:

```shell
$ redis-server   # Start redis server on default port

# … Open a new terminal tab to run backend server

$ cd backend     # Go into backend folder if not already
$ npm run dev    # Start server

# … Open a new terminal tab to run client app

$ cd frontend    # Go into frontend folder
$ ng serve --port 4201      # Run Angular app; Will start application on http://localhost:4201/
```

## Running database migrations

Switch to the `/backend` directory.



## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Contributing

##### 1. Create or choose an issue from the `Issues` tab

##### 2. Branch off develop and add your fix in a new branch titled `issue-{issue-number}`

##### 3. Push your changes

##### 4. Create a pull request with appropriate title and description

##### 5. Add `Closes #{issue-number}` at the bottom of the PR description

##### 6. Create the pull request and await for approval or feedback.
