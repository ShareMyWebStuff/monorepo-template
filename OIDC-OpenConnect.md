# Open Connect

## AWS Setup

### Create the Provider

Need to create the provider on AWS. Logon to the console and goto IAM.

Select "Identity provider" in the left hand menu.

For the provider :  https://token.actions.githubusercontent.com

For the audience:  sts.amazonaws.com

Click crete provide

### Create a Role for Provider

Select Create Role

Select Custom trust policy

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::{AWS Account Id}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                }
            }
        }
    ]
}

although it may be better to use

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::{AWS Account Id}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringLike": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                    "token.actions.githubusercontent.com:sub": "repo:sharemywebstuff/oidc-deployments:*"
                }
            }
        }
    ]
}

Click next - give it a role name 

We have now created the role. We now need to give it permissions to add CDK deployments.

Click Add permnissions -> Create inline policy
Goto JSON and add

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": {
                "arn:aws:iam::*:role/cdk-*
            }
        }
    ]
}

** Now the provider is created **


## Create the github action

We need to create a github action similar to below. Replace the role with the one we created above.


jobs:
  deploy:
    name: Upload to Amazon S3
    runs-on: ubuntu-latest
    # These permissions are needed to interact with GitHub's OIDC Token endpoint.
    permissions:
      id-token: write
      contents: read
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Configure AWS credentials from Test account
      uses: aws-actions/configure-aws-credentials@v2
      with:
        role-to-assume: arn:aws:iam::111111111111:role/my-github-actions-role-test
        aws-region: us-east-1
    - name: Copy files to the test website with the AWS CLI
      run: |
        aws s3 sync . s3://my-s3-test-website-bucket
    - name: Configure AWS credentials from Production account
      uses: aws-actions/configure-aws-credentials@v2
      with:
        role-to-assume: arn:aws:iam::222222222222:role/my-github-actions-role-prod
        aws-region: us-west-2
    - name: Copy files to the production website with the AWS CLI
      run: |
        aws s3 sync . s3://my-s3-prod-website-bucket


## Reading Information



