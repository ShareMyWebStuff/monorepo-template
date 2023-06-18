
https://tylangesmith.com/blog/building-a-nextjs-serverless-static-site-using-aws-cdk

https://github.com/tylangesmith-organisation/nextjs-serverless-static-site/tree/master/.github/deploy


GHA Permission issue

git update-index --chmod=+x ./.github/deploy/scripts/lint_test_build.sh




## Hosting

Before running this it is expected that a route 53 hosted zone has been created. This is used to create the domain name for the website. 
This will consist of a NS recordset that points to where the domain is hosted and a SOA record that points to the NS recordset.

From the route 53 recordset for this domain, click on the Hosted zone details and copy the Hosted zone ID. This will be used in the cdk.json file.



## Documentation

### How to test your AWS Lambda function locally with CDK
https://beabetterdev.com/2022/05/06/how-to-test-your-aws-lambda-function-locally-with-cdk/

#### Working examples
sam local invoke -t ./apps/tutorseekers-api/cdk.out

sam local invoke -t ./apps/tutorseekers-api/cdk.out/template.yaml --event ./apps/tutorseekers-api/events/event.json

sam local start-api -t ./apps/tutorseekers-api/cdk.out/CdkStack.template.json


### Deploy static website to S3 using github actions
https://github.com/jviloria96744/react-aws-cdk-template


### Build Monorepo using turbo
https://blog.logrocket.com/build-monorepo-next-js/

### Turbo monorepo example
https://github.com/Tonel/typescript-monorepo/tree/main

### AWS CDK Creating ECR Repository and uploading Docker Image Locally
https://containers-cdk-react-amplify.ws.kabits.com/backend-containers-with-aws-cdk/prerequisites/

### Backend Course - Github Actions creating and deploying Docker Image to ECR
https://www.youtube.com/watch?v=3M4MPmSWt9E

Githib repository for the youtube video above
https://github.com/techschool/simplebank

### Fargate with CDK

Blog which expalins how to deploy nextjs to fargate with cdk - okayish
https://blog.tirthaguha.net/2022-guide-to-deploy-nextjs-containers-on-fargate-with-cdk

Brilliant article on how to deploy nextjs to fargate with cdk - including create a docker image
https://dev.to/zoun/deploy-a-next-js-application-on-aws-using-cdk-fargate-2dnh

## Amazon Aurora Serverless
https://aws.amazon.com/blogs/compute/understanding-database-options-for-your-serverless-web-applications/

Need a proxy server and aurora database

## Aurora Tutorial - Good
https://www.youtube.com/watch?v=ciRbXZqBl7M

## Solution based on this
https://dev.to/wakeupmh/create-aurora-mysql-on-top-of-cdk-with-ts-3949



npm install <package> --workspace=<workspace>






`


# Article Used to Create This
https://blog.logrocket.com/build-monorepo-next-js/

Creating New Project

mkdir app/<project name>
Create the app
yarn create next-app admin -- This is for nextjs
cdk init app language=typescript -- This is for aws cdk

## Add to Pipeline so commands run

From the root directory edit the turbo.json file. Add to the pipeline

  "pipeline": {
    "dev": {
      "cache": false
    }
  }

  As turbo will only run items that are declared in the root packages.json file, we need to add calling this script in the scripts object

"scripts": {
    "dev": "turbo run dev --parallel"
}

## Setup Eslint

In the new project we need to setup the linting

For this project remove every eslint package
and insert the following code

{
  "devDependencies": {
   "eslint-config-custom": "*"
  }    
}

Create / update the .eslintrc.json file in the project
{
  "root": true,
  "extends": ["custom"] // Tells ESLint to use the "eslint-config-custom" package
}

Run the following to 
yarn install

Add the linting scrips to the package.json file in the application

{
  "lint": "eslint .",
  "format": "eslint --fix --ext .js,.jsx ."
}




turbo dev --filter <workflow>

Creates 
turbo prune --scope="docs" --docker

## THIS HAS github actions and husky
https://github.com/wk0/boilerplate-next/tree/as-workspace

## NextJS with Docker and Turbo Example

https://github.com/vercel/turbo/blob/main/examples/with-docker/apps/web/next.config.js

docker run -p 3000:3000 mono4-web
docker-compose -f docker-compose.yml build

    "cdk": "cdk",

yarn run build:backend


## Add docker image to ECR
https://containers-cdk-react-amplify.ws.kabits.com/backend-containers-with-aws-cdk/creating-docker-image/

## Good Video
https://www.youtube.com/watch?v=3M4MPmSWt9E





## Authentication

We are authenticatinbg using username / password or google. This is done using cognito.

Create a project in google developer console (google for google developer console)


##
##
## Excellent Example
##
##
https://dev.to/zoun/deploy-a-next-js-application-on-aws-using-cdk-fargate-2dnh


