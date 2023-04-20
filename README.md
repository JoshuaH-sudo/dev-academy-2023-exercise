# Helsinki city bike app (Dev Academy pre-assignment)
[![CI/CD](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/codecov.yml/badge.svg)](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/codecov.yml)
[![codecov](https://codecov.io/gh/JoshuaH-sudo/dev-academy-2023-exercise/branch/main/graph/badge.svg?token=Z1DXOYNLL2)](https://codecov.io/gh/JoshuaH-sudo/dev-academy-2023-exercise)

For explanations, instructions and more information, please see the [wiki](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/wiki).

See the live version of application, deployed on AWS ECS, [here](http://docke-loadb-1s0k0aqe98uqa-775cba9cf9f80be8.elb.ap-southeast-2.amazonaws.com:8080/)
## Setup
### Prerequisites: 
Have yarn and docker installed on your machine.
This application was designed to mainly be run on a linux, WSL or equivalent OS/System

### Run locally from repo
- Clone repo
- Have a instance of mongo running.
- Install dependencies: `yarn install`
- Run `MONGO_URI=<mongo_uri> PORT=8080 yarn start`
- Open browser [here](http://localhost:8080/)

### Run docker stack from repo
- Clone repo
- Run either (will setup mongo database and run the app):
  - The development version: `yarn docker_dev`
  - The production version: `yarn docker_prod` 
  - The full release version: `yarn docker_release`
- Open browser [here](http://localhost:8080/)

### Run tests
- Run all tests: `yarn test`
- Run frontend tests: `yarn frontend_test`
- Run backend tests: `yarn frontend_test`

### Docker image
```
docker pull joshuahsudo/hsl_bike_app
```

## Features
- All required and additional requirements of the exercise.
- Figma designs for each major UI component.
- Dockerize application.
- Switch stations from within the single station view.
- Jest test suite for both front and backend code, using in-memory test mongoDB.
- Github action workflow to automate testing.

## Tech-stack, tools and libraries
### Front-end
- JS
- TS
- React
- Elastic UI

### Back-end
- NodeJS
- ExpressJS
- MongoDB
- Mongoose

### Misc
- Jest
- Docker
- Github Actions
- Figma
- Yarn
