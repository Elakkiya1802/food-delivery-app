pipeline {
    agent any
    environment {
        DOCKER_HUB = "your-dockerhub-username/food-delivery-app"
        AWS_REGION = "ap-south-1"          // change to your region
        ECS_CLUSTER = "FoodAppCluster"     // your ECS cluster name
        ECS_SERVICE = "FoodAppService"     // your ECS service name
        TASK_FAMILY = "FoodAppTask"        // your ECS task definition family name
    }
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/Elakkiya1802/food-delivery-app.git
'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_HUB:$BUILD_NUMBER .'
                sh 'docker tag $DOCKER_HUB:$BUILD_NUMBER $DOCKER_HUB:latest'
            }
        }
        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push $DOCKER_HUB:$BUILD_NUMBER'
                    sh 'docker push $DOCKER_HUB:latest'
                }
            }
        }
        stage('Update ECS Task Definition') {
            steps {
                sh '''
                # Get the current task definition JSON
                TASK_DEFINITION=$(aws ecs describe-task-definition \
                  --task-definition $TASK_FAMILY \
                  --region $AWS_REGION)

                # Create a new task definition with updated image
                NEW_DEF=$(echo $TASK_DEFINITION | \
                  jq --arg IMAGE "$DOCKER_HUB:$BUILD_NUMBER" \
                  '.taskDefinition | .containerDefinitions[0].image = $IMAGE | 
                   {family: .family, networkMode: .networkMode, containerDefinitions: .containerDefinitions, 
                   requiresCompatibilities: .requiresCompatibilities, cpu: .cpu, memory: .memory}')

                # Register the new task definition
                echo $NEW_DEF > new-task-def.json
                aws ecs register-task-definition --cli-input-json file://new-task-def.json --region $AWS_REGION
                '''
            }
        }
        stage('Deploy to ECS Fargate') {
            steps {
                sh '''
                # Force service to use the new task definition
                LATEST_REV=$(aws ecs describe-task-definition --task-definition $TASK_FAMILY --region $AWS_REGION \
                  | jq -r '.taskDefinition.revision')

                aws ecs update-service \
                  --cluster $ECS_CLUSTER \
                  --service $ECS_SERVICE \
                  --task-definition $TASK_FAMILY:$LATEST_REV \
                  --region $AWS_REGION
                '''
            }
        }
    }
}
