# Helsinki city bike app (Dev Academy pre-assignment)
[![Tests](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/tests.yml/badge.svg)](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/tests.yml)
[![CI/CD](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/cicd.yml/badge.svg)](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/actions/workflows/cicd.yml)
[![codecov](https://codecov.io/gh/JoshuaH-sudo/dev-academy-2023-exercise/branch/main/graph/badge.svg?token=Z1DXOYNLL2)](https://codecov.io/gh/JoshuaH-sudo/dev-academy-2023-exercise)

For explanations, instructions and more information, please see the [wiki](https://github.com/JoshuaH-sudo/dev-academy-2023-exercise/wiki).

See the live version of application, deployed on AWS ECS [here](http://hsl-b-loadb-11qff09munsyd-65616a73f46464ed.elb.ap-southeast-2.amazonaws.com:8080/)
## Setup
### Prerequisites: 
Have yarn and docker installed on your machine.
This application was designed to mainly be run on a linux, WSL or equivalent OS/System

### Run locally from repo
- Clone repo
- Have a instance of mongo running.
- Install dependencies: `yarn install`
- Build app:
  - Development version run `yarn dev_build`
  - Production version run `yarn prod_build`
- Run `MONGO_URI=<mongo_uri> PORT=8080 yarn start`
- Open browser [here](http://localhost:8080/)

**Note:** Example mongo_uri: `mongodb://localhost:27017/hsl_bike_app`

### Run docker stack from repo
- Clone repo
- Run either (will setup mongo database and run the app):
  - The full release version on ECS: `yarn docker_release`
  - The development build version: `yarn docker_dev`
  - The production build version: `yarn docker_prod` 
- Open browser [here](http://localhost:8080/)

### Run tests
- Run all tests: `yarn test`
- Run frontend tests: `yarn frontend_test`
- Run backend tests: `yarn frontend_test`
  
*Please note: that there are current problems with mongoDB's support for Ubuntu 22.04 so backend tests may not be runnable see issue [here](https://github.com/nodkz/mongodb-memory-server/issues/732) and [here](https://github.com/shelfio/jest-mongodb/issues/351)*

### [Docker image](https://hub.docker.com/r/joshuahsudo/hsl_bike_app)
```
docker pull joshuahsudo/hsl_bike_app:latest
```

## Features
- All required and additional requirements of the exercise.
- Figma designs for each major UI component.
- Dockerize application.
- Switch station views from within the single station view.
- Jest test suite for both front and backend code, using in-memory test mongoDB.
- Github action workflow to automate testing.
- Full CI/CD workflow deployment.
