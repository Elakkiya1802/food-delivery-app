pipeline {
    agent any
    environment {
        DOCKER_HUB   = "elakkiya18/food-delivery-app"
        AWS_REGION   = "ap-south-1"      
        ECS_CLUSTER  = "FoodAppCluster"
        ECS_SERVICE  = "foodappservice"
        TASK_FAMILY  = "frontend"
    }
    stages {
        stage('Checkout') {
            steps {
                // If repo is public, no credentials needed
                git branch: 'main',
                    url: 'https://github.com/Elakkiya1802/food-delivery-app.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t $DOCKER_HUB:$BUILD_NUMBER .
                    docker tag $DOCKER_HUB:$BUILD_NUMBER $DOCKER_HUB:latest
                '''
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push $DOCKER_HUB:$BUILD_NUMBER
                        docker push $DOCKER_HUB:latest
                    '''
                }
            }
        }

        stage('Update ECS Task Definition') {
            steps {
                sh '''
                    TASK_DEFINITION=$(aws ecs describe-task-definition \
                      --task-definition $TASK_FAMILY \
                      --region $AWS_REGION)

                    NEW_DEF=$(echo $TASK_DEFINITION | \
                      jq --arg IMAGE "$DOCKER_HUB:$BUILD_NUMBER" \
                      '.taskDefinition |
                        {family: .family, taskRoleArn: .taskRoleArn, executionRoleArn: .executionRoleArn,
                         networkMode: .networkMode, containerDefinitions: (.containerDefinitions | map(.image = $IMAGE)),
                         requiresCompatibilities: .requiresCompatibilities, cpu: .cpu, memory: .memory}')

                    echo $NEW_DEF > new-task-def.json
                    aws ecs register-task-definition --cli-input-json file://new-task-def.json --region $AWS_REGION
                '''
            }
        }

        stage('Deploy to ECS Fargate') {
            steps {
                sh '''
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
