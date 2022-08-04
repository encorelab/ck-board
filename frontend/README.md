## Description

This Common Knowledge (CK) Board is the latest rebuild of the ENCORE Lab's collaborative canvas for guiding collective inquiry and active learning activities.

## Setup

#### 1. Install Node.js and Angular

- Node: https://nodejs.org/
  - Use the LTS versions. v16 works, v17 has some compatabily issues
- Angular: `npm install -g @angular/cli `

#### 2. Clone the repository

```shell
$ git clone https://github.com/encorelab/ck-board.git
```

#### 3. Install required dependencies

If you are building locally or on an instance install depedancies with

```shell
$ npm ci
```

Only if you are installing a NEW package use

```shell
$ npm install
```

#### 4. You're now ready to start developing!

```shell
$ ng serve --open # will start application on http://localhost:4200/
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
