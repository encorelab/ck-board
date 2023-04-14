## Description

This Common Knowledge (CK) Board is the latest rebuild of the ENCORE Lab's collaborative canvas for guiding collective inquiry and active learning activities.

## Setup

### 1. Install Node.js and Angular

- Node: https://nodejs.org/
  - Use the LTS versions. v16 works, v17 has some compatabily issues
- Angular: `npm install -g @angular/cli `

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
DB_USER=[Mongoose DB Username]
DB_PASSWORD=[Mongoose DB Password]
DB_URL=[Mongoose DB URL]
DB_NAME=[Mongoose DB Name]
JWT_SECRET=[JWT Secret Token]
PORT=8001
```

**SCORE SSO**

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

Start server first, then start client app once the server has successfully started:

```shell
$ cd backend     # Go into backend folder if not already
$ npm run dev    # Start server

# … Open a new terminal tab to run client app

$ cd frontend    # Go into frontend folder
$ ng serve --port 4201      # Run Angular app; Will start application on http://localhost:4201/
```

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
