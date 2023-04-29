# check environment variables are defined
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "AWS_ACCESS_KEY_ID is not defined"
  exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "AWS_SECRET_ACCESS_KEY is not defined"
  exit 1
fi

if [ -z "$AWS_DEFAULT_REGION" ]; then
  echo "AWS_DEFAULT_REGION is not defined"
  exit 1
fi

if [ -z "$DOCKER_CONTEXT" ]; then
  echo "DOCKER_CONTEXT is not defined, set the correct ECS docker context"
  exit 1
fi

rm -f ./aws/cloud_template.yml
docker-compose --context $DOCKER_CONTEXT -f ./docker/docker-compose.release.yml -p hsl-bike-app convert >> ./aws/cloud_template.yml